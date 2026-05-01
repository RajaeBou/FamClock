from config import SERVO_MIN_ANGLE, SERVO_MAX_ANGLE


def validate_startup_config(members, slots):
    if not members:
        raise ValueError("Aucun membre configuré pour l'initialisation.")

    if not slots:
        raise ValueError("Aucun slot/position configuré.")

    seen_servo_channels = set()
    valid_slot_numbers = set()

    for slot in slots:
        slot_number = int(slot["slotNumber"])
        angle = float(slot["angle"])

        if angle < SERVO_MIN_ANGLE or angle > SERVO_MAX_ANGLE:
            raise ValueError(
                f"Angle invalide pour le slot {slot_number} : {angle}°."
            )

        valid_slot_numbers.add(slot_number)

    for member in members:
        name = member.get("name", "inconnu")
        servo_channel = int(member["servoChannel"])
        current_slot = int(member["currentSlot"])

        if servo_channel in seen_servo_channels:
            raise ValueError(
                f"Conflit détecté : plusieurs membres utilisent le servo {servo_channel}."
            )

        seen_servo_channels.add(servo_channel)

        if current_slot not in valid_slot_numbers:
            raise ValueError(
                f"Le membre {name} pointe vers un slot inexistant : {current_slot}."
            )