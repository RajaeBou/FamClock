import json
import os

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "family_config.json")


def load_local_config():
    if not os.path.exists(CONFIG_FILE):
        return {}

    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return {}


def save_local_config(data):
    with open(CONFIG_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def load_family_id():
    data = load_local_config()
    return data.get("familyId")


def save_family_id(family_id):
    data = load_local_config()
    data["familyId"] = family_id
    save_local_config(data)


def load_auto_sync_config():
    data = load_local_config()
    return {
        "memberName": data.get("memberName"),
        "intervalSeconds": int(data.get("intervalSeconds", 15)),
        "enabled": bool(data.get("enabled", False)),
    }


def save_auto_sync_config(member_name=None, interval_seconds=None, enabled=None):
    data = load_local_config()

    if member_name is not None:
        data["memberName"] = member_name

    if interval_seconds is not None:
        data["intervalSeconds"] = int(interval_seconds)

    if enabled is not None:
        data["enabled"] = bool(enabled)

    save_local_config(data)