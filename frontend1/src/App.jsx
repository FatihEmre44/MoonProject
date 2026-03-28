import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import Lighting from './components/Lighting';
import MoonSurface from './components/MoonSurface';
import Rover from './components/Rover';
import PathLine from './components/PathLine';
import Stars from './components/Stars';
import HUD from './components/HUD';
import MiniMap from './components/MiniMap';

import { pathToWorld } from './utils/coordinateMapper';
import { CRATERS, ROVER_PATH, GRID_SIZE } from './utils/sampleData';

/**
 * App — Main orchestrator for the 3D Moon Rover scene (200×200 map).
 */
export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Convert 2D path to 3D world positions (terrain-aware)
  const worldPath = pathToWorld(ROVER_PATH, {
    gridWidth: GRID_SIZE,
    gridHeight: GRID_SIZE,
    yOffset: 0.15,
  });

  const roverGridPos = ROVER_PATH[currentStep] || [0, 0];

  const handleStart = useCallback(() => {
    setIsPlaying(true);
    setIsFinished(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentStep(0);
  }, []);

  const handleStep = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
  }, []);

  const handleFinish = useCallback(() => {
    setIsPlaying(false);
    setIsFinished(true);
    setCurrentStep(ROVER_PATH.length - 1);
  }, []);

  return (
    <>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [60, 50, 60], fov: 50, near: 0.1, far: 600 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000');
          gl.toneMapping = 1;
          gl.toneMappingExposure = 1.2;
        }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <Stars />

          {/* Fog for depth — extended for large map */}
          <fog attach="fog" args={['#000000', 80, 250]} />

          <Lighting />

          <MoonSurface gridSize={GRID_SIZE} />

          <PathLine path={worldPath} currentStep={currentStep} />

          <Rover
            path={worldPath}
            isPlaying={isPlaying}
            speed={4}
            onStep={handleStep}
            onFinish={handleFinish}
          />

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={200}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>

      {/* HUD overlay */}
      <HUD
        roverPosition={{ col: roverGridPos[0], row: roverGridPos[1] }}
        currentStep={currentStep}
        totalSteps={ROVER_PATH.length - 1}
        isPlaying={isPlaying}
        isFinished={isFinished}
        onStart={handleStart}
        onReset={handleReset}
      />

      {/* Mini-map overlay */}
      <MiniMap
        gridSize={GRID_SIZE}
        craters={CRATERS}
        roverPath={ROVER_PATH}
        currentStep={currentStep}
      />
    </>
  );
}
