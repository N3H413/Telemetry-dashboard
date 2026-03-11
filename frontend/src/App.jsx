import { useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import GaugeComponent from 'react-gauge-component';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { FaPause, FaPlay, FaStop, FaCrosshairs, FaClock } from 'react-icons/fa';
import './App.css';
 
// Register ChartJS modules
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);
 
// Connect to the Python telemetry server
const socket = io('http://localhost:5000');
 
// --- THE CAMERA CHASE TRACKER ---
function CameraTracker({ data }) {
  useFrame((state) => {
    // 1. Get the car's exact current position in 3D space (X and Y swapped for the grid)
    const carPos = new THREE.Vector3(data.y, 0.5, data.x);
 
    // 2. Define the camera offset (8 meters high, 10 meters behind)
    const offset = new THREE.Vector3(0, 8, -10);
 
    // 3. Rotate the offset so the camera swings around when the car turns
    const yawRad = -data.yaw * (Math.PI / 180);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
 
    // 4. Update the camera's position and force it to look directly at the car
    state.camera.position.copy(carPos.clone().add(offset));
    state.camera.lookAt(carPos);
  });
  return null; 
}
 
function App() {
  const [data, setData] = useState({ speed: 0, steer: 0, yaw: 0, x: 0, y: 0, z: 0 });
  
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(0);
  const intervalRef = useRef(null);
 
  const [path, setPath] = useState([]);
  const MAX_PATH_POINTS = 500;
 
  // --- Timer Logic ---
  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsedTime;
    intervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 10); 
  };
  const stopTimer = () => clearInterval(intervalRef.current);
  const resetTimer = () => { stopTimer(); setElapsedTime(0); };
 
  const formatTime = (time) => {
    const minutes = Math.floor((time / 1000) / 60);
    const seconds = Math.floor((time / 1000) % 60);
    const centiseconds = Math.floor((time / 10) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
  };
 
  // --- Data Listener ---
  useEffect(() => {
    socket.on('telemetry', (incomingData) => {
      if (isRunning) {
        setData(incomingData);
        setPath(prevPath => {
          const newPath = [...prevPath, { x: incomingData.x, y: incomingData.y }];
          if (newPath.length > MAX_PATH_POINTS) newPath.shift();
          return newPath;
        });
      }
    });
    return () => { socket.off('telemetry'); stopTimer(); };
  }, [isRunning]);
 
  useEffect(() => { if (isRunning) startTimer(); return stopTimer; }, [isRunning]);
 
  // --- Button Controls ---
  const handlePausePlay = () => {
    setIsRunning(!isRunning);
    if (!isRunning) startTimer(); else stopTimer();
  };
  const handleStop = () => {
    setIsRunning(false);
    resetTimer();
    setPath([]); 
    setData({ speed: 0, steer: 0, yaw: 0, x: 0, y: 0, z: 0 });
  };
  const handleCrosshair = () => console.log("Crosshair view clicked.");
 
  // --- 2D Chart ---
  const chartData = {
    datasets: [{
      label: 'Vehicle Path',
      data: path,
      borderColor: 'red',
      backgroundColor: 'transparent',
      showLine: true, 
      pointRadius: 1, 
    }],
  };
  const chartOptions = {
    scales: {
      x: { title: { display: true, text: 'X (m)' }, type: 'linear', position: 'bottom', grid: { color: '#333' } },
      y: { title: { display: true, text: 'Y (m)' }, type: 'linear', position: 'left', grid: { color: '#333' } },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false, 
  };
 
  // --- The Kinematic Direction Pointer Logic ---
  const pointerPoints = useMemo(() => {
    const startZ = 1.0;  // Start at the nose of the car
    const L = 1.5;       // Visual wheelbase length for our 3D box
    const maxDist = 4.0; // How far into the future to draw the path (meters)
    const numPoints = 30; // Smoothness of the curve
    const pts = [];
 
    const steerRad = data.steer * (Math.PI / 180);
 
    // If driving mostly straight, draw a straight line
    if (Math.abs(steerRad) < 0.01) {
      for (let i = 0; i <= numPoints; i++) {
        pts.push([0, 0, startZ + (i / numPoints) * maxDist]);
      }
      return pts;
    }
 
    // Calculate exact turning radius
    const R = L / Math.tan(steerRad); 
 
    // Plot points along the circular arc
    for (let i = 0; i <= numPoints; i++) {
      const s = (i / numPoints) * maxDist; // Distance along the arc
      const theta = s / R;                 // Angle swept along the arc
 
      // Calculate X and Z relative to the car's nose
      const dx = R * (1 - Math.cos(theta));
      const dz = R * Math.sin(theta);
 
      pts.push([dx, 0, startZ + dz]);
    }
 
    return pts;
  }, [data.steer]);
 
  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <div className="header-bar">
        <button className={`control-btn play-pause-btn ${isRunning ? 'running' : 'paused'}`} onClick={handlePausePlay}>
          {isRunning ? <FaPause /> : <FaPlay />}
        </button>
        <button className="control-btn stop-btn" onClick={handleStop}>
          <FaStop />
        </button>
        <button className="control-btn crosshair-btn" onClick={handleCrosshair}>
          <FaCrosshairs />
        </button>
        <div className="stopwatch-readout">
          <FaClock />
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>
 
      <div className="dashboard-layout">
        
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="gauges-container">
            <div className="gauge-wrapper">
              <GaugeComponent
                type="semicircle"
                arc={{ colorArray: ['#00FF00', '#FFFF00', '#FF0000'], padding: 0.02, subArcs: [{ limit: 30 }, { limit: 50 }, { limit: 70 }] }}
                value={data.speed} minValue={0} maxValue={70}
              />
              <h3>SPEED: {data.speed.toFixed(2)} cm/s</h3>
            </div>
            <div className="gauge-wrapper">
              <GaugeComponent
                type="semicircle"
                arc={{ colorArray: ['#FF0000', '#00FF00', '#FF0000'], padding: 0.02, subArcs: [{ limit: -10 }, { limit: 10 }, { limit: 25 }] }}
                value={data.steer} minValue={-25} maxValue={25}
              />
              <h3>STEER: {data.steer.toFixed(2)} °</h3>
            </div>
          </div>
 
          <div className="raw-data">
            <p><span style={{ color: 'red' }}>Yaw:</span> {data.yaw.toFixed(2)}°</p>
            <p><span style={{ color: 'green' }}>x:</span> {data.x.toFixed(2)}</p>
            <p><span style={{ color: 'blue' }}>y:</span> {data.y.toFixed(2)}</p>
            <p><span style={{ color: 'white' }}>z:</span> {data.z.toFixed(2)}</p>
          </div>
 
          <div className="path-plot-container">
            <Scatter data={chartData} options={chartOptions} />
          </div>
        </div>
 
        {/* RIGHT PANEL: 3D MAP */}
        <div className="right-panel">
          <Canvas>
            {/* The Camera Tracker locks the view onto the car */}
            <CameraTracker data={data} />
            
            <ambientLight intensity={0.5} />
            <Grid infiniteGrid fadeDistance={40} sectionColor="gray" cellColor="#333" />
            
            {/* X AND Y ARE SWAPPED HERE FOR THE 3D POSITION */}
            <group position={[data.y, 0.5, data.x]} rotation={[0, -data.yaw * (Math.PI / 180), 0]}>
              
              {/* Cyan Wireframe Car Body */}
              <mesh>
                <boxGeometry args={[1, 1, 2]} />
                <meshStandardMaterial color="cyan" wireframe={true} linewidth={1} />
              </mesh>
 
              {/* Green/Yellow Future Path Arc */}
              <Line
                points={pointerPoints} 
                color="#ccff00" 
                lineWidth={3} 
                dashed={true}   
                dashSize={0.2}
                gapSize={0.1}
              />
 
              {/* Yellow Labels (Still displaying standard X/Y to match your request) */}
              <Html distanceFactor={1.5} position={[0.5, 0.6, 0.5]} center>
                <div className="car-label">
                  <span style={{color: 'yellow'}}>x: {data.x.toFixed(2)} y: {data.y.toFixed(2)}</span>
                </div>
              </Html>
 
            </group>
          </Canvas>
        </div>
 
      </div>
    </div>
  );
}
 
export default App;