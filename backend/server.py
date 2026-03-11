from flask import Flask
from flask_socketio import SocketIO
import time
import math
import threading
import logging
 
# Disable default Flask logging so it doesn't interrupt your typing
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
 
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
 
# Global variables to hold the targets you type in the terminal
target_speed = 0.0  # cm/s
target_steer = 0.0  # degrees
 
def simulation_loop():
    """Runs the realistic physics math continuously in the background."""
    global target_speed, target_steer
    dt = 0.1                # 10Hz update rate
    wheelbase = 0.26        # 1:10 scale wheelbase
    x, y, z = 0.0, 0.0, 0.0
    yaw_rad = 0.0
    current_speed = 0.0
    current_steer = 0.0
 
    while True:
        # Smoothly approach the terminal targets (simulates physical inertia)
        current_speed += (target_speed - current_speed) * 0.1
        current_steer += (target_steer - current_steer) * 0.2
 
        speed_m_s = current_speed / 100.0
        steer_rad = math.radians(current_steer)
 
        # Kinematic bicycle math
        yaw_rate = (speed_m_s / wheelbase) * math.tan(steer_rad)
        yaw_rad += yaw_rate * dt
 
        x += speed_m_s * math.cos(yaw_rad) * dt
        y += speed_m_s * math.sin(yaw_rad) * dt
 
        data = {
            "speed": current_speed,
            "steer": current_steer,
            "yaw": math.degrees(yaw_rad),
            "x": x,
            "y": y,
            "z": z
        }
        socketio.emit('telemetry', data)
        time.sleep(dt)
 
def terminal_input_loop():
    """Waits for you to type new commands in the terminal."""
    global target_speed, target_steer
    
    # Give the server a second to start up before printing instructions
    time.sleep(1)
    print("\n" + "="*50)
    print("🎮 MANUAL SIMULATION CONTROL ACTIVATED 🎮")
    print("Type two numbers separated by a space: [SPEED] [STEER]")
    print("Example: '30 15' (30 cm/s speed, 15 degree right turn)")
    print("Example: '20 -10' (20 cm/s speed, 10 degree left turn)")
    print("Example: '0 0' (Stop and center steering)")
    print("="*50 + "\n")
 
    while True:
        try:
            # Wait for user to type and press Enter
            user_input = input("Enter [SPEED] [STEER]: ")
            parts = user_input.strip().split()
            
            # Update speed if at least one number is provided
            if len(parts) >= 1:
                target_speed = float(parts[0])
            # Update steering if a second number is provided
            if len(parts) >= 2:
                target_steer = float(parts[1])
                
            print(f"✅ Targets updated -> Speed: {target_speed} cm/s | Steer: {target_steer}°\n")
        except ValueError:
            print("❌ Invalid input! Please enter numbers only (e.g., '20 -10').\n")
        except KeyboardInterrupt:
            # Handle Ctrl+C gracefully
            break
 
if __name__ == '__main__':
    # Start the physics simulation in the background
    threading.Thread(target=simulation_loop, daemon=True).start()
    
    # Start the terminal input listener in the background
    threading.Thread(target=terminal_input_loop, daemon=True).start()
    
    # Run the server (use_reloader=False is critical here so the input() function doesn't crash)
    socketio.run(app, port=5000, use_reloader=False)