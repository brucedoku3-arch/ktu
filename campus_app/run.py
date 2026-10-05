import os
from app import create_app
from config import config_by_name

# Dynamically resolve environment configuration (defaults to 'development')
env_name = os.getenv("FLASK_ENV", "development").lower()
config_class = config_by_name.get(env_name, config_by_name["default"])

# Instantiate the Flask application via factory
app = create_app(config_class=config_class)

if __name__ == "__main__":
    # Host on 0.0.0.0 to enable local Wi-Fi mobile device debugging & network testing
    is_debug = app.config.get("DEBUG", False)
    app.run(host="0.0.0.0", port=5000, debug=is_debug)
