from api_client import fetch_startup_config
from config import DEFAULT_FAMILY_ID
from local_config import load_family_id
from mapper import build_slots_map
from safety import validate_startup_config
from servo_controller import ServoController


def resolve_family_id(explicit_family_id=None):
    if explicit_family_id:
        return explicit_family_id

    saved_family_id = load_family_id()
    if saved_family_id:
        return saved_family_id

    if DEFAULT_FAMILY_ID:
        return DEFAULT_FAMILY_ID

    raise ValueError(
        "Aucun familyId configuré. Configure une famille via Flask "
        "ou définis FAMCLOCK_FAMILY_ID."
    )


def initialize_clock(family_id=None):
    family_id = resolve_family_id(family_id)

    print("Démarrage de l'initialisation des aiguilles...")

    payload = fetch_startup_config(family_id)

    members = payload.get("members", [])
    slots = payload.get("slots", [])
    warnings = payload.get("warnings", [])

    if warnings:
        print("Warnings backend :")
        for warning in warnings:
            print(f" - {warning}")

    validate_startup_config(members, slots)

    slots_map = build_slots_map(slots)

    servo_controller = ServoController()
    servo_controller.move_members_sequentially(members, slots_map)

    print("Initialisation terminée avec succès.")

    return {
        "success": True,
        "familyId": family_id,
        "membersCount": len(members),
        "warnings": warnings,
        "members": members,
    }


def main():
    result = initialize_clock()
    print(result)


if __name__ == "__main__":
    main()