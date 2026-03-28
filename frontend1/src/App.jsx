import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import MenuTrigger from "./components/ui/MenuTrigger";
import ControlSidebar from "./components/ui/ControlSidebar";
import Minimap from "./components/ui/Minimap";
import RouteBot from "./components/ui/RouteBot";
import MoonSurface from "./components/MoonSurface";
import PathLine from "./components/PathLine";
import Lighting from "./components/Lighting";
import Stars from "./components/Stars";
import Rover from "./components/Rover";
import { getTerrainHeight } from "./utils/terrainUtils";
import {
  worldToGrid,
  gridToWorld,
  pathToWorld,
} from "./utils/coordinateMapper";
import {
  buildMapDataFromProfile,
  sendAstarRequest,
} from "./utils/buildMapData";

const INITIAL_TELEMETRY = {
  speed: 1.85,
  pitch: -2.4,
  roll: 1.3,
  x: 126.5,
  y: 4.1,
  z: -342.7,
  temperature: 45.2,
};

const INITIAL_TARGET = {
  name: "Crater A-19",
  distance: 1480,
};

const INITIAL_LOGS = [
  { id: 1, text: "ROVER OS v1.0 boot complete", level: "ok" },
  { id: 2, text: "Navigation uplink established", level: "ok" },
  { id: 3, text: "Pathfinding...", level: "ok" },
];

const missionMessages = [
  "Pathfinding...",
  "Lidar scan in progress",
  "Obstacle detected: micro crater",
  "Autonomous correction applied",
  "Signal stable with relay node",
  "Thermal sensors nominal",
  "Subsurface scan complete",
];

const ROVER_ANCHORS = {
  "low-crater": [0, 0, 78],
  "mid-crater": [0, 0, 78],
  "high-crater": [0, 0, 78],
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function CameraController({ roverPosition, isRoverFocused }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const isFirstFocusFrame = useRef(true);
  const shouldResetToOverview = useRef(false);

  const mapPosition = useMemo(() => new THREE.Vector3(0, 150, 150), []);
  const mapLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (isRoverFocused) {
      // Update the OrbitControls target to follow the rover every frame
      targetLookAt.set(
        roverPosition[0],
        roverPosition[1] + 1.1,
        roverPosition[2],
      );
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt, 0.1);
      }

      // Perform a smooth transition to the initial follow distance only on the first frame of focus
      if (isFirstFocusFrame.current) {
        targetPosition.set(
          roverPosition[0] + 12,
          roverPosition[1] + 8,
          roverPosition[2] + 12,
        );
        camera.position.lerp(targetPosition, 0.05);
        if (camera.position.distanceTo(targetPosition) < 0.5) {
          isFirstFocusFrame.current = false;
        }
      }

      // Flag that we'll need to reset to overview next time focus is toggled off
      shouldResetToOverview.current = true;
    } else {
      // Reset focus flag for the next time we enter focus mode
      isFirstFocusFrame.current = true;

      if (shouldResetToOverview.current) {
        // Smoothly move to overview position ONLY ONCE after focus is disabled
        camera.position.lerp(mapPosition, 0.05);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(mapLookAt, 0.05);
        }

        // Stop fighting the user once we're reasonably close to the overview
        if (camera.position.distanceTo(mapPosition) < 0.5) {
          shouldResetToOverview.current = false;
        }
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={1.2}
      zoomSpeed={1.5}
      panSpeed={1.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={5}
      maxDistance={1200}
    />
  );
}

function TargetMarker({ position }) {
  const groupRef = useRef(null);
  const pulseRingRef = useRef(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.5;

    if (pulseRingRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.4;
      pulseRingRef.current.scale.set(s, s, 1);
      pulseRingRef.current.material.opacity = 0.6 - Math.sin(t * 3) * 0.4;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + 0.1, position[2]]}
    >
      {/* Ground rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.5, 0.7, 48]} />
        <meshStandardMaterial
          color="#00f2ff"
          emissive="#00f2ff"
          emissiveIntensity={4}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh
        ref={pulseRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[1.0, 1.2, 48]} />
        <meshStandardMaterial
          color="#00f2ff"
          emissive="#00f2ff"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Vertical Beam */}
      <mesh position={[0, 15, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.02, 0.1, 30, 16]} />
        <meshStandardMaterial
          color="#00f2ff"
          emissive="#00f2ff"
          emissiveIntensity={8}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Floating marker */}
      <mesh position={[0, 1.8, 0]} raycast={() => null}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#ff3d5f"
          emissive="#ff003c"
          emissiveIntensity={10}
        />
      </mesh>

      <pointLight distance={8} intensity={2} color="#00f2ff" />
    </group>
  );
}

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isRoverMoving, setIsRoverMoving] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isGridEnabled, setIsGridEnabled] = useState(true);
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [target, setTarget] = useState(INITIAL_TARGET);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [selectedMap, setSelectedMap] = useState("mid-crater");
  const [isRoverFocused, setIsRoverFocused] = useState(false);
  const [roverResetSignal, setRoverResetSignal] = useState(0);
  const [selectedTargetGrid, setSelectedTargetGrid] = useState(null);
  const [plannedRouteWorld, setPlannedRouteWorld] = useState([]);
  const [roverRouteIndex, setRoverRouteIndex] = useState(0);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [isExplainingRoute, setIsExplainingRoute] = useState(false);
  const [customRoverAnchors, setCustomRoverAnchors] = useState({});

  const roverStartPosition = useMemo(() => {
    const override = customRoverAnchors[selectedMap];
    const [x, z] = override ?? (ROVER_ANCHORS[selectedMap] ? [ROVER_ANCHORS[selectedMap][0], ROVER_ANCHORS[selectedMap][2]] : [0, 78]);
    return [x, getTerrainHeight(x, z, selectedMap) + 0.48, z];
  }, [customRoverAnchors, selectedMap]);

  const [roverLivePosition, setRoverLivePosition] =
    useState(roverStartPosition);

  const selectedTargetWorld = useMemo(() => {
    if (!selectedTargetGrid) return null;
    const [row, col] = selectedTargetGrid;
    const { x, z } = gridToWorld(col, row);
    const y = getTerrainHeight(x, z, selectedMap);
    return [x, y, z];
  }, [selectedTargetGrid, selectedMap]);

  useEffect(() => {
    setRoverLivePosition(roverStartPosition);
  }, [roverStartPosition]);

  useEffect(() => {
    setIsRoverMoving(false);
    setSelectedTargetGrid(null);
    setPlannedRouteWorld([]);
    setRouteAnalysis(null);
    setTarget(INITIAL_TARGET);
    setRoverResetSignal((prev) => prev + 1);
  }, [selectedMap]);

  const handleTerrainTargetSelect = ({ x, z, button = 0 }) => {
    if (button === 2) {
      if (isRoverMoving) {
        setLogs((prev) => [
          ...prev.slice(-7),
          {
            id: Date.now(),
            text: "Rover hareket ederken baslangic konumu degistirilemez",
            level: "warn",
          },
        ]);
        return;
      }

      const y = getTerrainHeight(x, z, selectedMap) + 0.48;
      setCustomRoverAnchors((prev) => ({ ...prev, [selectedMap]: [x, z] }));
      setIsRoverMoving(false);
      setPlannedRouteWorld([]);
      setSelectedTargetGrid(null);
      setRouteAnalysis(null);
      setRoverRouteIndex(0);
      setRoverLivePosition([x, y, z]);
      setRoverResetSignal((prev) => prev + 1);
      setLogs((prev) => [
        ...prev.slice(-7),
        {
          id: Date.now(),
          text: "Rover baslangic konumu sag tik ile guncellendi",
          level: "ok",
        },
      ]);
      return;
    }

    const { row, col } = worldToGrid(x, z);
    const clampedRow = Math.max(0, Math.min(199, row));
    const clampedCol = Math.max(0, Math.min(199, col));
    setSelectedTargetGrid([clampedRow, clampedCol]);

    const dx = x - roverLivePosition[0];
    const dz = z - roverLivePosition[2];
    const distance = Math.hypot(dx, dz);

    setTarget({
      name: `GRID [${clampedRow}, ${clampedCol}]`,
      distance,
    });

    setLogs((prev) => [
      ...prev.slice(-7),
      {
        id: Date.now(),
        text: `Hedef secildi: [${clampedRow}, ${clampedCol}]`,
        level: "ok",
      },
    ]);
  };

  const handlePlanRoute = async () => {
    if (!selectedTargetGrid) {
      throw new Error("Lutfen harita uzerinde hedef noktayi tiklayin");
    }

    const mapData = buildMapDataFromProfile(selectedMap);
    const start = worldToGrid(roverLivePosition[0], roverLivePosition[2]);
    const waypoints = [
      [
        Math.max(0, Math.min(199, start.row)),
        Math.max(0, Math.min(199, start.col)),
      ],
      selectedTargetGrid,
    ];

    const result = await sendAstarRequest(
      { ...mapData, waypoints },
      "http://localhost:3000",
      false,
    );

    if (!result?.success || !Array.isArray(result.path)) {
      setRouteAnalysis(result || null);
      return result;
    }

    const worldPath = pathToWorld(result.path);
    setPlannedRouteWorld(worldPath);
    setIsRoverMoving(false);
    setRoverResetSignal((prev) => prev + 1);
    setRouteAnalysis(result);

    setLogs((prev) => [
      ...prev.slice(-7),
      {
        id: Date.now(),
        text: `Rota olusturuldu: ${result.stats.stepCount} adim`,
        level: "ok",
      },
    ]);

    return result;
  };

  const handleExplainRoute = async () => {
    if (!selectedTargetGrid) return;
    try {
      setIsExplainingRoute(true);
      setRouteAnalysis((prev) => ({
        ...(prev || {}),
        aiReport: "Rota analizi aliniyor...",
      }));
      await handlePlanRoute();
      setLogs((prev) => [
        ...prev.slice(-7),
        {
          id: Date.now(),
          text: "Bot rota gerekcesini guncelledi",
          level: "ok",
        },
      ]);
    } catch (error) {
      setRouteAnalysis((prev) => ({
        ...(prev || {}),
        aiReport: `Aciklama alinamadi: ${error.message}`,
      }));
    } finally {
      setIsExplainingRoute(false);
    }
  };

  useEffect(() => {
    if (!isRoverMoving) return undefined;

    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const speed = Math.max(0.3, prev.speed + randomRange(-0.35, 0.45));
        const x = prev.x + speed * 0.72;
        const y = Math.max(0, prev.y + randomRange(-0.22, 0.22));
        const z = prev.z + randomRange(0.9, 1.95);

        return {
          speed,
          pitch: randomRange(-14, 14),
          roll: randomRange(-10, 10),
          x,
          y,
          z,
          temperature: Math.max(35, prev.temperature + randomRange(-2, 3)),
        };
      });

      setTarget((prev) => ({
        ...prev,
        distance: Math.max(0, prev.distance - randomRange(3, 9)),
      }));

      setLogs((prev) => {
        const next =
          missionMessages[Math.floor(Math.random() * missionMessages.length)];
        const level = next.toLowerCase().includes("obstacle") ? "warn" : "ok";
        const entry = { id: Date.now(), text: next, level };
        return [...prev.slice(-7), entry];
      });
    }, 950);

    return () => clearInterval(timer);
  }, [isRoverMoving]);

  useEffect(() => {
    if (!selectedTargetGrid) return;
    const [row, col] = selectedTargetGrid;
    const targetWorld = gridToWorld(col, row);
    const distance = Math.hypot(
      targetWorld.x - roverLivePosition[0],
      targetWorld.z - roverLivePosition[2],
    );
    setTarget((prev) => ({
      ...prev,
      name: `GRID [${row}, ${col}]`,
      distance,
    }));
  }, [roverLivePosition, selectedTargetGrid]);

  const handleToggleGrid = () => {
    setIsGridEnabled((prev) => !prev);
    setLogs((prev) => [
      ...prev.slice(-7),
      {
        id: Date.now(),
        text: `Navigation grid ${isGridEnabled ? "disabled" : "enabled"}`,
        level: "ok",
      },
    ]);
  };

  const handleResetSimulation = () => {
    // Reset rover motion timeline.
    setIsRoverMoving(false);
    setIsRoverFocused(false);
    setRoverResetSignal((prev) => prev + 1);
    setRoverLivePosition(roverStartPosition);
    setPlannedRouteWorld([]);
    setSelectedTargetGrid(null);
    setTarget(INITIAL_TARGET);
    setRouteAnalysis(null);
  };

  const handleReturnToMenu = () => {
    setIsStarted(false);
    setIsRoverMoving(false);
    setIsPanelOpen(false);
    setIsGridEnabled(true);
    setIsRoverFocused(false);
    setTelemetry(INITIAL_TELEMETRY);
    setTarget(INITIAL_TARGET);
    setLogs(INITIAL_LOGS);
    setSelectedMap("mid-crater");
    setSelectedTargetGrid(null);
    setPlannedRouteWorld([]);
    setRoverRouteIndex(0);
    setRouteAnalysis(null);
    setRoverResetSignal((prev) => prev + 1);
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-obsidian text-cyan-50"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 lunar-background" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0 }}
        animate={isStarted ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
      >
        {isStarted && (
          <div className="relative h-full w-full">
            {/* Harita köşeleri karartıldı; bitiş karartması ve küçük haritayı absorbe eden vignette */}
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,0.85) 66%, rgba(0,0,0,1) 94%)",
                mixBlendMode: "multiply",
              }}
            />
            <Canvas
              camera={{ position: [0, 150, 150], fov: 55, far: 3000 }}
              style={{ width: "100%", height: "100%", background: "#000" }}
              onCreated={({ scene }) => {
                scene.background = new THREE.Color("#000000");
              }}
            >
              <Suspense fallback={null}>
                <Stars />
                <Lighting />
                <MoonSurface
                  selectedMap={selectedMap}
                  isGridEnabled={isGridEnabled}
                  onSelectTarget={handleTerrainTargetSelect}
                />
                {selectedTargetWorld && (
                  <TargetMarker position={selectedTargetWorld} />
                )}
                {plannedRouteWorld.length > 0 && (
                  <PathLine
                    path={plannedRouteWorld}
                    currentStep={roverRouteIndex}
                    selectedMap={selectedMap}
                  />
                )}
                <Rover
                  initialPosition={roverStartPosition}
                  rotationY={Math.PI}
                  mapId={selectedMap}
                  isPlaying={isRoverMoving}
                  headlightsOn={isRoverMoving || plannedRouteWorld.length > 0}
                  routePoints={plannedRouteWorld}
                  resetSignal={roverResetSignal}
                  onPositionChange={setRoverLivePosition}
                  onStepChange={setRoverRouteIndex}
                  onRouteComplete={() => {
                    setIsRoverMoving(false);
                    setLogs((prev) => [
                      ...prev.slice(-7),
                      {
                        id: Date.now() + Math.random(),
                        text: "Rover hedefe ulasti",
                        level: "ok",
                      },
                    ]);
                  }}
                  onObstacleHit={() => {
                    setLogs((prev) => [
                      ...prev.slice(-7),
                      {
                        id: Date.now() + Math.random(),
                        text: "Rock impact detected: stabilizer response active",
                        level: "warn",
                      },
                    ]);
                  }}
                />
                <CameraController
                  roverPosition={roverLivePosition}
                  isRoverFocused={isRoverFocused}
                />
              </Suspense>
            </Canvas>
          </div>
        )}
      </motion.section>

      <div className="pointer-events-none absolute inset-0 z-50">
        <AnimatePresence mode="wait">
          {!isStarted && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 p-6"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="panel-glass w-full max-w-xl rounded-3xl p-8 text-center"
              >
                <p className="mb-2 text-xs tracking-[0.45em] text-cyan-200/80">
                  LUNAR ROVER CONTROL
                </p>
                <h1 className="mb-6 text-2xl font-semibold tracking-[0.2em] text-cyan-100">
                  MISSION CONTROL HUD
                </h1>

                <div className="mb-6">
                  <h3 className="mb-3 text-xs tracking-[0.25em] text-cyan-200/70">
                    HARİTA SEÇ
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        id: "low-crater",
                        label: "Mare Tranquillitatis",
                        icon: "○",
                      },
                      {
                        id: "mid-crater",
                        label: "Oceanus Procellarum",
                        icon: "◎",
                      },
                      {
                        id: "high-crater",
                        label: "Tycho Highlands",
                        icon: "◉",
                      },
                    ].map((map) => (
                      <motion.button
                        key={map.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMap(map.id)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${selectedMap === map.id
                          ? "border-cyan-300/60 bg-cyan-500/20 text-cyan-100"
                          : "border-cyan-300/20 bg-black/20 text-cyan-200/70 hover:bg-cyan-500/10"
                          }`}
                      >
                        {map.icon} {map.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsStarted(true)}
                  className="w-full rounded-xl border border-blue-400/50 bg-blue-500/20 px-6 py-4 text-sm font-bold tracking-[0.3em] text-blue-100 shadow-lg shadow-blue-500/20 transition-all hover:border-blue-300/70 hover:bg-blue-500/30 hover:shadow-blue-500/40"
                >
                  ▶▶▶ BAŞLAT ▶▶▶
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isStarted && (
            <>
              <MenuTrigger
                isPanelOpen={isPanelOpen}
                onClick={() => setIsPanelOpen((prev) => !prev)}
              />

              <ControlSidebar
                isOpen={isPanelOpen}
                telemetry={telemetry}
                logs={logs}
                target={target}
                onResetSimulation={handleResetSimulation}
                onReturnToMenu={handleReturnToMenu}
                onClose={() => setIsPanelOpen(false)}
                selectedMap={selectedMap}
                onSelectMap={setSelectedMap}
                selectedTargetGrid={selectedTargetGrid}
                onPlanRoute={handlePlanRoute}
                onStartRover={() => {
                  if (plannedRouteWorld.length < 2) return;
                  setIsRoverMoving(true);
                }}
                canStartRover={plannedRouteWorld.length >= 2}
              />

              <Minimap
                isStarted={isStarted}
                selectedMap={selectedMap}
                isGridEnabled={isGridEnabled}
                isRoverFocused={isRoverFocused}
                onToggleGrid={handleToggleGrid}
                onToggleRoverFocus={() => setIsRoverFocused((prev) => !prev)}
                roverPath={plannedRouteWorld}
                roverPosition={roverLivePosition}
              />

              <RouteBot
                isStarted={isStarted}
                message={routeAnalysis?.aiReport || null}
                hasRoute={plannedRouteWorld.length >= 2}
                isExplaining={isExplainingRoute}
                onExplainRoute={handleExplainRoute}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
