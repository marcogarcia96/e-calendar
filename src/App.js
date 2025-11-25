// src/App.js
import React, { useState, useEffect } from "react";

import WeatherPanel from "./components/WeatherPanel";
import ForecastOverlay from "./components/ForecastOverlay";
import CalendarPanel from "./components/CalendarPanel";
import NotesPanel from "./components/NotesPanel";
import ClockOverlay from "./components/ClockOverlay";

import "./App.css";

export default function App() {
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);

  // Clock time + date
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      // Format time
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Format date
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateClock(); // run immediately
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <div className="dashboard">
        <div className="bottom-row">
          {/* LEFT: Big Calendar */}
          <div className="main-column">
            <CalendarPanel onClockClick={() => setIsClockOpen(true)} />
          </div>

          {/* RIGHT: Weather + Notes */}
          <div className="side-column">
            <WeatherPanel onOpenForecast={() => setIsForecastOpen(true)} />
            <NotesPanel />
          </div>
        </div>
      </div>

      {/* 🌤 Forecast Overlay */}
      {isForecastOpen && (
        <ForecastOverlay onClose={() => setIsForecastOpen(false)} />
      )}

      {/* ⏰ Clock Overlay */}
      {isClockOpen && (
        <ClockOverlay
          time={currentTime}
          date={currentDate}
          onClose={() => setIsClockOpen(false)}
        />
      )}
    </div>
  );
}






