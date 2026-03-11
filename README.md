# Autonomous Vehicle Telemetry Dashboard
 
A real-time, full-stack web dashboard built to monitor 1:10 scale autonomous vehicles (like those used in the Bosch Future Mobility Challenge). 
 
 
 
This system uses a Python backend to relay vehicle data (or run a Kinematic Bicycle Model simulation) and a React frontend to visualize the data in real-time using 3D graphics, 2D plotting, and dynamic gauges.
 
## Project Structure
This repository is a monorepo containing two main parts:
* **`/backend`**: The Python server that handles websocket connections and physics simulation.
* **`/frontend`**: The Vite/React application that renders the 3D dashboard.
 
## Global Quick Start
To run the full system locally, you need two terminal windows running simultaneously.
 
**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python server.py


**Terminal 2 (Frontend)**
cd frontend
nmp install
npm run dev

Open the browser to http://localhost:5173 to view the dashboard

See the individual README files in the frontend and backend folders for specific details.
