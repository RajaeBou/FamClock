import os

BACKEND_BASE_URL = os.getenv("FAMCLOCK_API_URL", "http://localhost:3000/api")
STARTUP_CONFIG_ENDPOINT = f"{BACKEND_BASE_URL}/startup/clock-config"

# Optionnel : famille par défaut si aucune n'est enregistrée localement
DEFAULT_FAMILY_ID = os.getenv("FAMCLOCK_FAMILY_ID", "").strip() or None

REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "10"))

SERVO_MIN_ANGLE = int(os.getenv("SERVO_MIN_ANGLE", "0"))
SERVO_MAX_ANGLE = int(os.getenv("SERVO_MAX_ANGLE", "360"))
SERVO_CHANNEL_COUNT = int(os.getenv("SERVO_CHANNEL_COUNT", "16"))

PCA9685_ADDRESS = int(os.getenv("PCA9685_ADDRESS", "0x40"), 16)

MOVE_DELAY_SECONDS = float(os.getenv("MOVE_DELAY_SECONDS", "0.8"))

# 1 = test sans vrai matériel
# 0 = vrai servo
USE_MOCK_SERVO = os.getenv("USE_MOCK_SERVO", "1") == "1"

FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5050"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"