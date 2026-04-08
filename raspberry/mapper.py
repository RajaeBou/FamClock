def build_slots_map(slots):
    slots_map = {}

    for slot in slots:
        slot_number = int(slot["slotNumber"])
        slots_map[slot_number] = {
            "label": slot.get("label", f"Position {slot_number}"),
            "angle": float(slot["angle"]),
        }

    return slots_map


def get_angle_for_member_slot(member, slots_map):
    current_slot = int(member["currentSlot"])

    if current_slot not in slots_map:
        raise ValueError(
            f"Le slot {current_slot} n'existe pas pour le membre {member.get('name', 'inconnu')}."
        )

    return slots_map[current_slot]["angle"]