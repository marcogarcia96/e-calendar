// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ical from "ical.js";
import "./App.css";

export default function App() {
  const [events, setEvents] = useState([]);

  // ✅ Collect ICS URLs from your .env file
  const icsUrls = useMemo(() => {
    const urls = [];

    // main/default ICS
    if (process.env.REACT_APP_ICAL_URL) {
      urls.push(process.env.REACT_APP_ICAL_URL);
    }

    // additional ones (REACT_APP_ICAL_URL_1, REACT_APP_ICAL_URL_2, etc.)
    Object.keys(process.env)
      .filter((key) => key.startsWith("REACT_APP_ICAL_URL_"))
      .forEach((key) => urls.push(process.env[key]));
      
    return urls;
  }, []);

  // ✅ Fetch ICS events using Electron (no CORS)
  const fetchICS = async (url) => {
    if (!window.electronAPI || !window.electronAPI.fetchICS) {
      throw new Error("Electron API not available (preload not loaded)");
    }
    return await window.electronAPI.fetchICS(url);
  };

  // ✅ Parse ICS on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const allEvents = [];

        for (const url of icsUrls) {
          const text = await fetchICS(url); // <-- Electron fetch (no browser CORS)
          const jcal = ical.parse(text);
          const comp = new ical.Component(jcal);
          const vevents = comp.getAllSubcomponents("vevent");

          vevents.forEach((ve) => {
            const event = new ical.Event(ve);
            allEvents.push({
              title: event.summary || "Untitled Event",
              start: event.startDate.toJSDate(),
              end: event.endDate?.toJSDate(),
            });
          });
        }

        setEvents(allEvents);
        console.log(`✅ Loaded ${allEvents.length} events from ICS`);
      } catch (err) {
        console.error("❌ ICS load error:", err);
      }
    }

    loadEvents();
  }, [icsUrls]);

  // ✅ Render FullCalendar
  return (
    <div className="App">
      <h1>My Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="80vh"
      />
    </div>
  );
}


