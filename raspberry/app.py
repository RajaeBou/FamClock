from flask import Flask, jsonify, request
import threading

from config import FLASK_DEBUG, FLASK_HOST, FLASK_PORT
from local_config import (
    load_family_id,
    save_family_id,
    load_auto_sync_config,
    save_auto_sync_config,
)
from startup import initialize_clock
from api_client import fetch_startup_config
from pico_serial import PicoSerialController

app = Flask(__name__)
pico = PicoSerialController()

auto_sync_thread = None
auto_sync_stop_event = threading.Event()


def get_selected_member_from_family(member_name):
    family_id = load_family_id()

    if not family_id:
        raise ValueError("Aucune famille enregistrée localement")

    payload = fetch_startup_config(family_id)
    members = payload.get("members", [])

    if not members:
        raise ValueError("Aucun membre trouvé pour cette famille")

    selected_member = None

    if member_name:
        normalized_target = member_name.strip().lower()
        for member in members:
            member_name_db = str(member.get("name", "")).strip().lower()
            if member_name_db == normalized_target:
                selected_member = member
                break
    else:
        selected_member = members[0]

    if not selected_member:
        raise ValueError(f"Membre introuvable : {member_name}")

    return selected_member


def convert_clock_angle_to_servo_angle(clock_angle):
    if clock_angle is None:
        raise ValueError("currentAngle manquant")

    clock_angle = float(clock_angle)

    # Engrenage 1:2 -> le servo fait 2x moins d'angle
    servo_angle = clock_angle / 2

    # Sécurité pour servo classique 0..180
    servo_angle = max(0, min(180, servo_angle))

    return servo_angle


def sync_member_to_pico(member_name):
    selected_member = get_selected_member_from_family(member_name)

    raw_angle = selected_member.get("currentAngle")
    servo_angle = convert_clock_angle_to_servo_angle(raw_angle)

    response = pico.move_angle(servo_angle)

    return {
        "member": selected_member.get("name"),
        "rawAngle": raw_angle,
        "servoAngle": servo_angle,
        "picoResponse": response,
    }


def auto_sync_worker():
    print("[AUTO_SYNC] Thread démarré")

    while not auto_sync_stop_event.is_set():
        try:
            config = load_auto_sync_config()
            enabled = config.get("enabled", False)
            member_name = config.get("memberName")
            interval_seconds = int(config.get("intervalSeconds", 15))

            if enabled and member_name:
                result = sync_member_to_pico(member_name)
                print(
                    f"[AUTO_SYNC] {result['member']} -> horloge {result['rawAngle']}° -> servo {result['servoAngle']}° | {result['picoResponse']}"
                )
            else:
                print("[AUTO_SYNC] Désactivé ou memberName absent")

            wait_seconds = max(1, interval_seconds)

        except Exception as error:
            print(f"[AUTO_SYNC ERROR] {error}")
            wait_seconds = 5

        auto_sync_stop_event.wait(wait_seconds)

    print("[AUTO_SYNC] Thread arrêté")


def start_auto_sync_thread():
    global auto_sync_thread

    if auto_sync_thread and auto_sync_thread.is_alive():
        print("[AUTO_SYNC] Thread déjà en cours")
        return False

    auto_sync_stop_event.clear()
    auto_sync_thread = threading.Thread(target=auto_sync_worker, daemon=True)
    auto_sync_thread.start()
    print("[AUTO_SYNC] Nouveau thread lancé")
    return True


def stop_auto_sync_thread():
    global auto_sync_thread

    auto_sync_stop_event.set()
    print("[AUTO_SYNC] Demande d'arrêt envoyée")
    return True


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "Raspberry Flask API running",
        "routes": [
            "/health",
            "/family",
            "/initialize",
            "/pico/ping",
            "/pico/move?angle=90",
            "/pico/test",
            "/pico/current-angle?memberName=Léa",
            "/auto-sync/config",
            "/auto-sync/start",
            "/auto-sync/stop",
            "/auto-sync/status",
            "/auto-sync/run-once"
        ]
    })


@app.get("/health")
def health():
    return jsonify({
        "success": True,
        "message": "Flask Raspberry OK"
    })


@app.get("/family")
def get_family():
    return jsonify({
        "success": True,
        "familyId": load_family_id()
    })


@app.post("/family")
def set_family():
    data = request.get_json(silent=True) or {}
    print("FAMILY BODY =", data)

    family_id = (data.get("familyId") or "").strip()

    if not family_id:
        return jsonify({
            "success": False,
            "message": "familyId requis"
        }), 400

    save_family_id(family_id)

    return jsonify({
        "success": True,
        "message": "familyId enregistré avec succès",
        "familyId": family_id
    })


@app.get("/initialize")
def initialize_get():
    try:
        result = initialize_clock()
        return jsonify(result)
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'initialisation",
            "error": str(error)
        }), 500


@app.post("/initialize")
def initialize_post():
    try:
        result = initialize_clock()
        return jsonify(result)
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'initialisation",
            "error": str(error)
        }), 500


@app.get("/pico/ping")
def pico_ping():
    try:
        response = pico.ping()
        return jsonify({
            "success": True,
            "response": response
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur de communication avec le Pico",
            "error": str(error)
        }), 500


@app.get("/pico/move")
def pico_move():
    try:
        angle = float(request.args.get("angle", 90))
        response = pico.move_angle(angle)

        return jsonify({
            "success": True,
            "angle": angle,
            "picoResponse": response
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant le déplacement du servo via Pico",
            "error": str(error)
        }), 500


@app.get("/pico/test")
def pico_test():
    try:
        response = pico.run_test()

        return jsonify({
            "success": True,
            "message": "Test Pico lancé",
            "picoResponse": response
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant le test Pico",
            "error": str(error)
        }), 500


@app.get("/pico/current-angle")
def pico_current_angle():
    try:
        member_name = (request.args.get("memberName") or "").strip()
        result = sync_member_to_pico(member_name)

        return jsonify({
            "success": True,
            "member": result["member"],
            "rawAngle": result["rawAngle"],
            "servoAngle": result["servoAngle"],
            "picoResponse": result["picoResponse"]
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'envoi de l'angle courant au Pico",
            "error": str(error)
        }), 500


@app.get("/auto-sync/config")
def get_auto_sync_config_route():
    config = load_auto_sync_config()
    return jsonify({
        "success": True,
        "config": config
    })


@app.post("/auto-sync/config")
def set_auto_sync_config_route():
    try:
        data = request.get_json(silent=True) or {}
        print("AUTO_SYNC BODY =", data)

        member_name = data.get("memberName")
        interval_seconds = data.get("intervalSeconds")
        enabled = data.get("enabled")

        save_auto_sync_config(
            member_name=member_name,
            interval_seconds=interval_seconds,
            enabled=enabled
        )

        return jsonify({
            "success": True,
            "message": "Configuration auto-sync enregistrée",
            "config": load_auto_sync_config()
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant la sauvegarde de la configuration auto-sync",
            "error": str(error)
        }), 500


@app.get("/auto-sync/start")
def auto_sync_start():
    try:
        config = load_auto_sync_config()

        if not config.get("memberName"):
            return jsonify({
                "success": False,
                "message": "Aucun memberName configuré pour l'auto-sync"
            }), 400

        save_auto_sync_config(enabled=True)

        first_result = sync_member_to_pico(config.get("memberName"))
        started = start_auto_sync_thread()

        return jsonify({
            "success": True,
            "message": "Auto-sync démarré",
            "threadStarted": started,
            "firstSync": first_result,
            "config": load_auto_sync_config()
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant le démarrage de l'auto-sync",
            "error": str(error)
        }), 500


@app.get("/auto-sync/stop")
def auto_sync_stop():
    try:
        stop_auto_sync_thread()
        save_auto_sync_config(enabled=False)

        return jsonify({
            "success": True,
            "message": "Auto-sync arrêté",
            "config": load_auto_sync_config()
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'arrêt de l'auto-sync",
            "error": str(error)
        }), 500


@app.get("/auto-sync/status")
def auto_sync_status():
    config = load_auto_sync_config()

    return jsonify({
        "success": True,
        "running": bool(auto_sync_thread and auto_sync_thread.is_alive()),
        "config": config
    })


@app.get("/auto-sync/run-once")
def auto_sync_run_once():
    try:
        config = load_auto_sync_config()
        member_name = config.get("memberName")

        if not member_name:
            return jsonify({
                "success": False,
                "message": "Aucun memberName configuré pour l'auto-sync"
            }), 400

        result = sync_member_to_pico(member_name)

        return jsonify({
            "success": True,
            "message": "Synchronisation exécutée une fois",
            "member": result["member"],
            "rawAngle": result["rawAngle"],
            "servoAngle": result["servoAngle"],
            "picoResponse": result["picoResponse"]
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'exécution unique de l'auto-sync",
            "error": str(error)
        }), 500


if __name__ == "__main__":
    try:
        config = load_auto_sync_config()
        if config.get("enabled") and config.get("memberName"):
            print("[BOOT] Auto-sync activé dans la config, démarrage du thread...")
            start_auto_sync_thread()
        else:
            print("[BOOT] Auto-sync non démarré au lancement")
    except Exception as error:
        print(f"[BOOT ERROR] {error}")

    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG,
        use_reloader=False
    )