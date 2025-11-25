// src/components/ClockOverlay.js
import React from "react";
import "./ClockOverlay.css";

export default function ClockOverlay({ time, date, onClose }) {
  return (
    <div className="clock-overlay" onClick={onClose}>
      <div className="clock-modal">
        <div className="clock-time">{time}</div>
        <div className="clock-date">{date}</div>
      </div>
    </div>
  );
}

