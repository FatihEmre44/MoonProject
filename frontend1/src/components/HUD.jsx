import React from 'react';

/**
 * HUD overlay — glassmorphism panels showing rover status and controls.
 * 
 * Props:
 * - roverPosition: { col, row }
 * - currentStep: number
 * - totalSteps: number
 * - isPlaying: boolean
 * - isFinished: boolean
 * - onStart: () => void
 * - onReset: () => void
 */
export default function HUD({
  roverPosition = { col: 0, row: 0 },
  currentStep = 0,
  totalSteps = 0,
  isPlaying = false,
  isFinished = false,
  onStart,
  onReset,
}) {
  const statusText = isFinished
    ? 'MISSION COMPLETE'
    : isPlaying
    ? 'EN ROUTE'
    : 'STANDBY';

  const statusClass = isFinished ? 'finished' : isPlaying ? 'active' : 'idle';

  return (
    <div className="hud-overlay">
      {/* Top-left info panel */}
      <div className="hud-panel top-left">
        <div className="hud-title">🌙 Moon Rover</div>

        <div className="hud-row">
          <span className="hud-label">Status</span>
          <span className="hud-value">
            <span className={`status-dot ${statusClass}`}></span>
            {statusText}
          </span>
        </div>

        <div className="hud-row">
          <span className="hud-label">Position</span>
          <span className="hud-value">
            [{roverPosition.col}, {roverPosition.row}]
          </span>
        </div>

        <div className="hud-row">
          <span className="hud-label">Step</span>
          <span className="hud-value">
            {currentStep} / {totalSteps}
          </span>
        </div>

        <div className="hud-row">
          <span className="hud-label">Progress</span>
          <span className="hud-value">
            {totalSteps > 0
              ? Math.round((currentStep / totalSteps) * 100)
              : 0}
            %
          </span>
        </div>
      </div>

      {/* Bottom-center control buttons */}
      <div className="hud-panel bottom-center">
        <button
          className="hud-btn primary"
          onClick={onStart}
          disabled={isPlaying}
          id="btn-start"
        >
          ▶ Start
        </button>
        <button
          className="hud-btn"
          onClick={onReset}
          id="btn-reset"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
