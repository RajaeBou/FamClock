from api_client import fetch_startup_config
from mapper import build_slots_map
from safety import validate_startup_config
from servo_controller import ServoController


def main():
    print("Démarrage de l'initialisation des aiguilles...")

    payload = fetch_startup_config()

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


if __name__ == "__main__":
    main()