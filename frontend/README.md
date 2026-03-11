```markdown
# Telemetry Dashboard - Frontend

This is the user interface for the telemetry system, built with React and Vite. It listens to a websocket stream and updates visuals at 60 FPS.

## Tech Stack
* **Framework:** React + Vite
* **3D Rendering:** Three.js & React Three Fiber / Drei
* **Charting:** Chart.js & react-chartjs-2
* **Websockets:** Socket.io-client

## Key Features
* **Live 3D Tracking (Chase Cam):** Renders the vehicle using a 3D bounding box on an infinite grid. The camera is locked to follow the vehicle dynamically.
* **Kinematic Path Projection:** Calculates and draws a realistic future-path arc based on the current steering angle and vehicle wheelbase.
* **Live Gauges:** Real-time visual readouts for speed (cm/s) and steering angle (degrees).
* **2D Path Plotting:** A live scatter plot mapping the vehicle's historical X/Y coordinates.

## Coordinate System Note
To align the 2D telemetry data with the 3D rendering engine, the Y-axis from the telemetry data is mapped to the X-axis of the 3D grid, and the X-axis from the telemetry data is mapped to the Z-axis (depth) of the 3D grid. The 2D chart displays standard X/Y mapping.

## Setup & Running
```bash
npm install
npm run dev
