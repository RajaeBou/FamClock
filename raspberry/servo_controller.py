import time

from config import (
    SERVO_MIN_ANGLE,
    SERVO_MAX_ANGLE,
    SERVO_CHANNEL_COUNT,
    PCA9685_ADDRESS,
    MOVE_DELAY_SECONDS,
    USE_MOCK_SERVO,
)
from mapper import get_angle_for_member_slot

try:
    from adafruit_servokit import ServoKit
except Exception:
    ServoKit = None


class ServoController:
    def __init__(self):
        self.use_mock = USE_MOCK_SERVO or ServoKit is None
        self.kit = None

        if not self.use_mock:
            self.kit = ServoKit(
                channels=SERVO_CHANNEL_COUNT,
                address=PCA9685_ADDRESS
            )

    def clamp_angle(self, angle):
        return max(SERVO_MIN_ANGLE, min(SERVO_MAX_ANGLE, float(angle)))

    def set_angle(self, channel, angle):
        clamped_angle = self.clamp_angle(angle)

        if self.use_mock:
            print(
                f"[MOCK SERVO] Canal {channel} -> angle {clamped_angle}°"
            )
            return

        self.kit.servo[int(channel)].angle = clamped_angle

    def move_members_sequentially(self, members, slots_map):
        for member in members:
            name = member.get("name", "inconnu")
            servo_channel = int(member["servoChannel"])
            angle = get_angle_for_member_slot(member, slots_map)

            print(
                f"Initialisation de {name} | servo={servo_channel} | angle={angle}°"
            )

            self.set_angle(servo_channel, angle)
            time.sleep(MOVE_DELAY_SECONDS)