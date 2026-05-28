import time

from config import MOVE_DELAY_SECONDS, USE_MOCK_SERVO
from pico_serial import PicoSerialController


# ==================================================
# Calibration physique WereO'clock
# ==================================================
# Les positions réelles du cadran après tes tests.
# index 0 à 7 = positions de l'horloge.
# Si le backend renvoie currentSlot = 1, on utilise l'index 0.
# Si le backend renvoie currentSlot = 8, on utilise l'index 7.
# ==================================================

CALIBRATED_POSITIONS = {
    0: 2,
    1: 60,
    2: 105,
    3: 145,
    4: 190,
    5: 230,
    6: 275,
    7: 310,
}


# ==================================================
# Calibration par servo
# ==================================================
# D'après tes tests :
# Servo 0 : angle * 0.90 / 2
# Servo 1 : angle * 0.95 / 2
# ==================================================

SERVO_CALIBRATION = {
    0: {
        "factor": 0.90,
        "offset": 0,
    },
    1: {
        "factor": 0.95,
        "offset": 0,
    },
}


# Rapport de l'engrenage :
# Si l'aiguille tourne 2 fois plus que le servo,
# alors on envoie au servo : angle_horloge / 2
GEAR_RATIO = 2


# Mémoire des derniers angles envoyés.
# Cela évite de renvoyer exactement la même commande toutes les 10 secondes.
LAST_SENT_ANGLE_BY_CHANNEL = {}


class ServoController:
    def __init__(self):
        self.pico = PicoSerialController()

    def get_member_name(self, member):
        return (
            member.get("name")
            or member.get("memberName")
            or "Membre inconnu"
        )

    def get_servo_channel(self, member):
        channel = member.get("servoChannel")

        if channel is None:
            channel = member.get("servo_channel")

        if channel is None:
            channel = 0

        return int(channel)

    def get_current_slot(self, member):
        slot = member.get("currentSlot")

        if slot is None:
            slot = member.get("current_slot")

        if slot is None:
            return None

        try:
            return int(slot)
        except (TypeError, ValueError):
            return None

    def get_current_angle(self, member):
        angle = member.get("currentAngle")

        if angle is None:
            angle = member.get("current_angle")

        if angle is None:
            angle = 0

        return float(angle)

    def get_calibrated_clock_angle(self, member):
        """
        Récupère l'angle calibré réel de l'horloge.

        Priorité :
        1. Utiliser currentSlot si disponible.
        2. Sinon utiliser currentAngle venant du backend.
        """

        slot = self.get_current_slot(member)

        if slot is not None:
            # Cas le plus probable : backend currentSlot = 1 à 8
            slot_index = slot - 1

            if slot_index in CALIBRATED_POSITIONS:
                return CALIBRATED_POSITIONS[slot_index], f"slot calibré {slot_index}"

            # Cas possible : slot déjà en 0 à 7
            if slot in CALIBRATED_POSITIONS:
                return CALIBRATED_POSITIONS[slot], f"slot calibré {slot}"

        # Fallback : on garde l'angle du backend
        return self.get_current_angle(member), "angle backend"

    def convert_clock_angle_to_servo_angle(self, clock_angle, channel=0):
        """
        Convertit l'angle réel de l'horloge en angle servo.

        Exemple :
        Servo 0 : angle * 0.90 / 2
        Servo 1 : angle * 0.95 / 2
        """

        calibration = SERVO_CALIBRATION.get(channel, {
            "factor": 1.0,
            "offset": 0,
        })

        factor = calibration.get("factor", 1.0)
        offset = calibration.get("offset", 0)

        servo_angle = (float(clock_angle) * factor) / GEAR_RATIO
        servo_angle = servo_angle + offset

        # Sécurité pour éviter les angles impossibles
        if servo_angle < 0:
            servo_angle = 0

        if servo_angle > 180:
            servo_angle = 180

        return int(round(servo_angle))

    def should_skip_move(self, channel, servo_angle):
        """
        Évite de renvoyer le même angle au même servo.
        La vérification toutes les 10 secondes continue,
        mais le servo ne reçoit une commande que si l'angle change.
        """

        last_angle = LAST_SENT_ANGLE_BY_CHANNEL.get(channel)

        if last_angle is None:
            return False

        return int(last_angle) == int(servo_angle)

    def move_member(self, member):
        name = self.get_member_name(member)
        channel = self.get_servo_channel(member)

        clock_angle, angle_source = self.get_calibrated_clock_angle(member)
        servo_angle = self.convert_clock_angle_to_servo_angle(clock_angle, channel)

        label = (
            member.get("currentLabel")
            or member.get("current_label")
            or "Position inconnue"
        )

        print("--------------------------------------------------")
        print(f"Membre : {name}")
        print(f"Servo channel : {channel}")
        print(f"Position : {label}")
        print(f"Source angle : {angle_source}")
        print(f"Angle horloge calibré : {clock_angle}")
        print(f"Angle servo envoyé : {servo_angle}")

        if self.should_skip_move(channel, servo_angle):
            print(
                f"[SKIP] Servo {channel} déjà à {servo_angle} degrés. "
                "Commande non renvoyée pour éviter les vibrations."
            )

            return {
                "success": True,
                "skipped": True,
                "mock": USE_MOCK_SERVO,
                "member": name,
                "channel": channel,
                "label": label,
                "clockAngle": clock_angle,
                "servoAngle": servo_angle,
                "message": "Angle déjà envoyé précédemment"
            }

        if USE_MOCK_SERVO:
            print(
                f"[MOCK] Aucun mouvement réel : "
                f"{name} → channel {channel}, "
                f"angle horloge {clock_angle}, "
                f"angle servo {servo_angle}"
            )

            LAST_SENT_ANGLE_BY_CHANNEL[channel] = servo_angle

            return {
                "success": True,
                "skipped": False,
                "mock": True,
                "member": name,
                "channel": channel,
                "label": label,
                "clockAngle": clock_angle,
                "servoAngle": servo_angle
            }

        response = self.pico.move_channel_angle(channel, servo_angle)

        LAST_SENT_ANGLE_BY_CHANNEL[channel] = servo_angle

        print(f"Réponse Pico pour {name} : {response}")

        return {
            "success": True,
            "skipped": False,
            "mock": False,
            "member": name,
            "channel": channel,
            "label": label,
            "clockAngle": clock_angle,
            "servoAngle": servo_angle,
            "picoResponse": response
        }

    def move_members_sequentially(self, members, slots_map=None):
        results = []

        print("Déplacement séquentiel des membres...")

        for member in members:
            result = self.move_member(member)
            results.append(result)

            time.sleep(MOVE_DELAY_SECONDS)

        print("Déplacement terminé.")

        return results