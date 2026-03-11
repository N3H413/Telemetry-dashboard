

# Telemetry Dashboard - Backend

This is the Python-based relay server and simulation engine for the telemetry dashboard.

## Tech Stack
* **Language:** Python 3.x
* **Server/Websockets:** Flask & Flask-SocketIO

## How It Works
The server currently runs in a multi-threaded configuration:
1. **Websocket Server:** Listens on port 5000 to broadcast data to the React frontend.
2. **Physics Simulation:** Runs a background loop calculating a Kinematic Bicycle Model based on user targets.
3. **Terminal Input Listener:** Allows the user to type live speed and steering targets to drive the vehicle in the simulation.

## Manual Simulation Controls
Once the server is running, you can control the 3D car on the dashboard by typing directly into the backend terminal.

**Format:** `[SPEED] [STEERING_ANGLE]`
* Speed is in cm/s.
* Steering is in degrees (-25 to 25).

**Examples:**
* `40 15` (Drive at 40 cm/s while turning right at 15 degrees)
* `20 -10` (Drive at 20 cm/s while turning left at 10 degrees)
* `0 0` (Stop the car and center the wheels)

## Setup & Running
```bash
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python server.py
```

_Note: If port 5000 is occupied, you can change the port in server.py and update the corresponding frontend URL._
