from flask import Flask, jsonify, request

from config import FLASK_DEBUG, FLASK_HOST, FLASK_PORT
from local_config import load_family_id, save_family_id
from startup import initialize_clock
from api_client import fetch_startup_config
from pico_serial import PicoSerialController

app = Flask(__name__)
pico = PicoSerialController()


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
            "/pico/current-angle?memberName=Léa"
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
                if member.get("name", "").lower() == member_name.lower():
                    selected_member = member
                    break
        else:
            selected_member = members[0]

        if not selected_member:
            return jsonify({
                "success": False,
                "message": f"Membre introuvable : {member_name}"
            }), 404

        angle = selected_member.get("currentAngle")
        response = pico.move_angle(angle)

        return jsonify({
            "success": True,
            "member": selected_member.get("name"),
            "angle": angle,
            "picoResponse": response
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Erreur pendant l'envoi de l'angle courant au Pico",
            "error": str(error)
        }), 500


if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)