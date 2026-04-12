import time
import serial

from config import (
    PICO_SERIAL_PORT,
    PICO_BAUDRATE,
    PICO_SERIAL_TIMEOUT,
    PICO_OPEN_DELAY_SECONDS,
)


class PicoSerialController:
    def __init__(self):
        self.ser = None

    def open(self):
        if self.ser and self.ser.is_open:
            return

        self.ser = serial.Serial(
            port=PICO_SERIAL_PORT,
            baudrate=PICO_BAUDRATE,
            timeout=PICO_SERIAL_TIMEOUT
        )

        time.sleep(PICO_OPEN_DELAY_SECONDS)
        self.ser.reset_input_buffer()

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()

    def _read_response(self):
        deadline = time.time() + PICO_SERIAL_TIMEOUT

        while time.time() < deadline:
            line = self.ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                return line

        return ""

    def send_command(self, command):
        self.open()

        self.ser.write((command + "\n").encode("utf-8"))
        self.ser.flush()

        response = self._read_response()
        return response or "NO_RESPONSE"

    def ping(self):
        return self.send_command("PING")

    def move_angle(self, angle):
        return self.send_command(f"ANGLE:{int(angle)}")

    def run_test(self):
        return self.send_command("TEST")