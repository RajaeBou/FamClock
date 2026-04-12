from flask import Flask, jsonify, request

from config import FLASK_DEBUG, FLASK_HOST, FLASK_PORT
from local_config import load_family_id, save_family_id
from startup import initialize_clock

app = Flask(__name__)


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


if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)