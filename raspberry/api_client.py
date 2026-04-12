import requests
from config import STARTUP_CONFIG_ENDPOINT, REQUEST_TIMEOUT_SECONDS


def fetch_startup_config(family_id=None):
    params = {}

    if family_id:
        params["familyId"] = family_id

    try:
        response = requests.get(
            STARTUP_CONFIG_ENDPOINT,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS
        )
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Impossible de contacter le backend à {STARTUP_CONFIG_ENDPOINT} : {exc}"
        ) from exc

    try:
        payload = response.json()
    except ValueError:
        payload = response.text

    if not response.ok:
        raise RuntimeError(
            f"Erreur backend {response.status_code} sur {response.url} : {payload}"
        )

    if not payload.get("success"):
        raise RuntimeError(f"Réponse backend invalide : {payload}")

    return payload