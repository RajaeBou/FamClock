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
        self.ser.reset_output_buffer()

        print(f"Pico connecté sur {PICO_SERIAL_PORT}")

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Port Pico fermé")

    def _read_response(self):
        deadline = time.time() + PICO_SERIAL_TIMEOUT
        last_line = ""

        while time.time() < deadline:
            line = self.ser.readline().decode("utf-8", errors="ignore").strip()

            if line:
                print(f"[PICO → RASPBERRY] {line}")
                last_line = line

                if (
                    line == "PONG"
                    or line == "TEST_OK"
                    or line.startswith("OK")
                    or line.startswith("ANGLE_OK")
                    or line.startswith("ERR")
                    or line.startswith("ERROR")
                ):
                    return line

        return last_line

    def send_command(self, command):
        try:
            self.open()

            self.ser.reset_input_buffer()

            full_command = command.strip() + "\n"
            print(f"[RASPBERRY → PICO] {full_command.strip()}")

            self.ser.write(full_command.encode("utf-8"))
            self.ser.flush()

            response = self._read_response()
            return response or "NO_RESPONSE"

        finally:
            self.close()

    def ping(self):
        return self.send_command("PING")

    def move_angle(self, angle):
        return self.send_command(f"ANGLE:{int(angle)}")

    def move_channel_angle(self, channel, angle):
        return self.send_command(f"ANGLE:{int(channel)}:{int(angle)}")

    def run_test(self):
        return self.send_command("TEST")