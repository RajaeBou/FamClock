import requests
from config import STARTUP_CONFIG_ENDPOINT, REQUEST_TIMEOUT_SECONDS, FAMILY_ID


def fetch_startup_config():
    params = {}

    if FAMILY_ID:
        params["familyId"] = FAMILY_ID

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

    if not response.ok:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = response.text

        raise RuntimeError(
            f"Erreur backend {response.status_code} sur {response.url} : {error_payload}"
        )

    payload = response.json()

    if not payload.get("success"):
        raise RuntimeError(f"Réponse backend invalide : {payload}")

    return payload