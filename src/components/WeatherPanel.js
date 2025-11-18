// src/components/WeatherPanel.js
import React from "react";

export default function WeatherPanel() {
  return (
    <div className="card weather-card">
      <div className="weather-top">
        <div className="weather-icon" />
        <div className="weather-info">
          <div className="weather-temp">89°F</div>
          <div className="weather-location">Los Angeles, CA</div>
        </div>
      </div>
      <div className="weather-time">Sat, October 25 · 11:34 AM</div>
    </div>
  );
}
