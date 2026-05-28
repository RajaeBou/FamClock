import threading
import time

from flask import Flask, jsonify, request

from config import FLASK_DEBUG, FLASK_HOST, FLASK_PORT
from local_config import load_family_id, save_family_id, load_local_config
from startup import initialize_clock
from api_client import fetch_startup_config
from pico_serial import PicoSerialController
from servo_controller import ServoController


app = Flask(__name__)
pico = PicoSerialController()

clock_lock = threading.Lock()

auto_sync_state = {
    "running": False,
    "thread": None,
    "lastResult": None,
    "lastError": None,
    "lastRunAt": None,
}


def safe_initialize_clock(family_id=None):
    """
    Évite que deux synchronisations bougent les servos en même temps.
    """
    with clock_lock:
        return initialize_clock(family_id)


def get_interval_seconds():
    config = load_local_config()

    try:
        interval = int(config.get("intervalSeconds", 10))
    except (TypeError, ValueError):
        interval = 10

    if interval < 3:
        interval = 3

    return interval


def get_configured_family_id():
    config = load_local_config()
    return config.get("familyId") or load_family_id()


def auto_sync_loop():
    print("[AUTO-SYNC] Boucle automatique démarrée")

    while auto_sync_state["running"]:
        try:
            config = load_local_config()

            if not config.get("enabled", True):
                auto_sync_state["lastError"] = (
                    "Synchronisation désactivée dans family_config.json"
                )
                print("[AUTO-SYNC] Synchronisation désactivée")
                break

            family_id = get_configured_family_id()

            if not family_id:
                auto_sync_state["lastError"] = "Aucun familyId configuré"
                print("[AUTO-SYNC] Aucun familyId configuré")
            else:
                print(f"[AUTO-SYNC] Synchronisation de la famille {family_id}")

                result = safe_initialize_clock(family_id)

                auto_sync_state["lastResult"] = result
                auto_sync_state["lastError"] = None
                auto_sync_state["lastRunAt"] = time.strftime("%Y-%m-%d %H:%M:%S")

                print("[AUTO-SYNC] Synchronisation terminée")

        except Exception as error:
            auto_sync_state["lastError"] = str(error)
            print(f"[AUTO-SYNC] Erreur : {error}")

        time.sleep(get_interval_seconds())

    auto_sync_state["running"] = False
    print("[AUTO-SYNC] Boucle automatique arrêtée")


def start_auto_sync_if_enabled():
    """
    Démarre automatiquement la synchronisation au lancement de Flask
    si family_config.json contient "enabled": true.
    """
    config = load_local_config()

    if not config.get("enabled", False):
        print("[AUTO-SYNC] Non démarré automatiquement : enabled=false")
        return

    if auto_sync_state["running"]:
        print("[AUTO-SYNC] Déjà actif")
        return

    auto_sync_state["running"] = True

    thread = threading.Thread(target=auto_sync_loop, daemon=True)
    auto_sync_state["thread"] = thread
    thread.start()

    print("[AUTO-SYNC] Démarré automatiquement au lancement de Flask")


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "Raspberry Flask API running",
        "routes": [
            "/health",
            "/family",
            "/initialize",
            "/auto-sync/once",
            "/auto-sync/start",
            "/auto-sync/stop",
            "/auto-sync/status",
            "/pico/ping",
            "/pico/move?angle=90",
            "/pico/move?channel=0&angle=90",
            "/pico/move?channel=1&angle=90",
            "/pico/test",
            "/pico/current-angle?memberName=Rajae"
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
        result = safe_initialize_clock()
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
        result = safe_initialize_clock()
        return jsonify(result)
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'initialisation",
            "error": str(error)
        }), 500


@app.get("/auto-sync/once")
def auto_sync_once():
    try:
        family_id = get_configured_family_id()

        if not family_id:
            return jsonify({
                "success": False,
                "message": "Aucun familyId configuré"
            }), 400

        result = safe_initialize_clock(family_id)

        auto_sync_state["lastResult"] = result
        auto_sync_state["lastError"] = None
        auto_sync_state["lastRunAt"] = time.strftime("%Y-%m-%d %H:%M:%S")

        return jsonify({
            "success": True,
            "message": "Synchronisation effectuée une fois",
            "result": result
        })

    except Exception as error:
        auto_sync_state["lastError"] = str(error)

        return jsonify({
            "success": False,
            "message": "Erreur pendant la synchronisation",
            "error": str(error)
        }), 500


@app.get("/auto-sync/start")
def auto_sync_start():
    try:
        if auto_sync_state["running"]:
            return jsonify({
                "success": True,
                "message": "La synchronisation automatique est déjà active",
                "intervalSeconds": get_interval_seconds()
            })

        auto_sync_state["running"] = True
        auto_sync_state["lastError"] = None

        thread = threading.Thread(target=auto_sync_loop, daemon=True)
        auto_sync_state["thread"] = thread
        thread.start()

        return jsonify({
            "success": True,
            "message": "Synchronisation automatique démarrée",
            "intervalSeconds": get_interval_seconds()
        })

    except Exception as error:
        auto_sync_state["running"] = False

        return jsonify({
            "success": False,
            "message": "Impossible de démarrer la synchronisation automatique",
            "error": str(error)
        }), 500


@app.get("/auto-sync/stop")
def auto_sync_stop():
    auto_sync_state["running"] = False

    return jsonify({
        "success": True,
        "message": "Synchronisation automatique arrêtée"
    })


@app.get("/auto-sync/status")
def auto_sync_status():
    return jsonify({
        "success": True,
        "running": auto_sync_state["running"],
        "intervalSeconds": get_interval_seconds(),
        "lastRunAt": auto_sync_state["lastRunAt"],
        "lastError": auto_sync_state["lastError"],
        "lastResult": auto_sync_state["lastResult"]
    })


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
        channel = request.args.get("channel")

        if channel is None:
            response = pico.move_angle(angle)
            command = f"ANGLE:{int(angle)}"
        else:
            channel = int(channel)
            response = pico.move_channel_angle(channel, angle)
            command = f"ANGLE:{channel}:{int(angle)}"

        return jsonify({
            "success": True,
            "angle": angle,
            "channel": channel,
            "command": command,
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
        family_id = load_family_id()

        if not family_id:
            return jsonify({
                "success": False,
                "message": "Aucune famille enregistrée localement"
            }), 400

        member_name = (request.args.get("memberName") or "").strip()

        payload = fetch_startup_config(family_id)
        members = payload.get("members", [])

        if not members:
            return jsonify({
                "success": False,
                "message": "Aucun membre trouvé pour cette famille"
            }), 404

        selected_member = None

        if member_name:
            for member in members:
                name = member.get("name") or member.get("memberName") or ""

                if name.lower() == member_name.lower():
                    selected_member = member
                    break
        else:
            selected_member = members[0]

        if not selected_member:
            return jsonify({
                "success": False,
                "message": f"Membre introuvable : {member_name}"
            }), 404

        servo_controller = ServoController()
        movement = servo_controller.move_member(selected_member)

        return jsonify({
            "success": True,
            "member": selected_member.get("name") or selected_member.get("memberName"),
            "selectedMember": selected_member,
            "movement": movement
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'envoi de l'angle courant au Pico",
            "error": str(error)
        }), 500


if __name__ == "__main__":
    start_auto_sync_if_enabled()

    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG,
        use_reloader=False
    )