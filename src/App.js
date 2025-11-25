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

  // 💤 idle timeout in ms (change this if you want)
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 60 seconds

  // ⏱ Keep updating time + date
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

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
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 💤 Idle detection: show clock after no activity
  useEffect(() => {
    let idleTimerId;

    const resetIdleTimer = () => {
      // Whenever there is user activity, close the clock if it's open
      // and restart the idle countdown.
      if (idleTimerId) clearTimeout(idleTimerId);

      idleTimerId = setTimeout(() => {
        setIsClockOpen(true); // open clock after idle
      }, IDLE_TIMEOUT);
    };

    // List of events that count as "activity"
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer));

    // Start the first timer
    resetIdleTimer();

    return () => {
      if (idleTimerId) clearTimeout(idleTimerId);
      events.forEach((evt) =>
        window.removeEventListener(evt, resetIdleTimer)
      );
    };
  }, [IDLE_TIMEOUT]);

  // When clock closes (user taps/clicks), just set isClockOpen false.
  // The idle effect will automatically restart the timer on the next activity.

  return (
    <div className="App">
      <div className="dashboard">
        <div className="bottom-row">
          {/* LEFT: Big Calendar */}
          <div className="main-column">
            {/* You can still manually open the clock from the calendar if you want */}
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

      {/* ⏰ Clock Overlay (screensaver style) */}
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






