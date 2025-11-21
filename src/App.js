// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import ical from "ical.js";

import WeatherPanel from "./components/WeatherPanel";
import ForecastOverlay from "./components/ForecastOverlay";
import CalendarPanel from "./components/CalendarPanel";
import NotesPanel from "./components/NotesPanel";
import TodoPanel from "./components/TodoPanel";

import "./App.css";

export default function App() {
  const [events, setEvents] = useState([]);
  const [isForecastOpen, setIsForecastOpen] = useState(false);

  // Collect ICS URLs from .env
  const icsUrls = useMemo(() => {
    const urls = [];

    if (process.env.REACT_APP_ICAL_URL) {
      urls.push(process.env.REACT_APP_ICAL_URL);
    }

    Object.keys(process.env)
      .filter((k) => k.startsWith("REACT_APP_ICAL_URL_"))
      .forEach((k) => urls.push(process.env[k]));

    return urls;
  }, []);

  // Use Electron bridge to fetch ICS (no CORS)
  const fetchICS = async (url) => {
    if (!window.electronAPI || !window.electronAPI.fetchICS) {
      throw new Error("Electron API not available (preload not loaded)");
    }
    return await window.electronAPI.fetchICS(url);
  };

  // Load events once on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const loaded = [];

        for (const url of icsUrls) {
          const text = await fetchICS(url);
          const jcal = ical.parse(text);
          const comp = new ical.Component(jcal);
          const vevents = comp.getAllSubcomponents("vevent");

          vevents.forEach((ve) => {
            const evt = new ical.Event(ve);
            loaded.push({
              title: evt.summary || "Untitled Event",
              start: evt.startDate.toJSDate(),
              end: evt.endDate?.toJSDate(),
            });
          });
        }

        setEvents(loaded);
        console.log("✅ Loaded events:", loaded.length);
      } catch (err) {
        console.error("❌ ICS load error:", err);
      }
    }

    loadEvents();
  }, [icsUrls]);

  return (
    <div className="App">
      <div className="dashboard">
        <div className="bottom-row">
          {/* LEFT: big calendar */}
          <div className="main-column">
            <CalendarPanel events={events} />
          </div>

          {/* RIGHT: Weather, Notes, To-Do */}
          <div className="side-column">
            <WeatherPanel onOpenForecast={() => setIsForecastOpen(true)} />
            <NotesPanel />
            <TodoPanel />
          </div>
        </div>
      </div>

      {/* 🔹 Overlay rendered on top of everything */}
      {isForecastOpen && (
        <ForecastOverlay onClose={() => setIsForecastOpen(false)} />
      )}
    </div>
  );
}

