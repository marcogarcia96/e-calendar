// src/components/CalendarPanel.js
import React, { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ical from "ical.js";
import "./CalendarPanel.css";

import DayDetailOverlay from "./DayDetailOverlay";

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // Collect ICS URLs from .env
  const icsUrls = useMemo(() => {
    const urls = [];

    if (process.env.REACT_APP_ICAL_URL) {
      urls.push(process.env.REACT_APP_ICAL_URL);
    }

    Object.keys(process.env)
      .filter((key) => key.startsWith("REACT_APP_ICAL_URL_"))
      .forEach((key) => urls.push(process.env[key]));

    return urls;
  }, []);

  // Fetch ICS through Electron (no CORS)
  const fetchICS = async (url) => {
    if (!window.electronAPI || !window.electronAPI.fetchICS) {
      throw new Error("Electron API not available (preload not loaded)");
    }
    return await window.electronAPI.fetchICS(url);
  };

  // Load and parse ICS on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const allEvents = [];

        for (const url of icsUrls) {
          const text = await fetchICS(url);
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

  // When a day box is clicked
  const handleDateClick = (info) => {
    const clickedDate = info.date;     // JS Date
    const iso = info.dateStr;         // "YYYY-MM-DD"

    const todaysEvents = events.filter((evt) => {
      const d = evt.start;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${da}` === iso;
    });

    setSelectedDate(clickedDate);
    setSelectedEvents(todaysEvents);
    setOverlayVisible(true);
  };

  return (
    <div className="card calendar-card">
      <div className="calendar-body">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="100%"
          expandRows={true}
          dateClick={handleDateClick}
        />
      </div>

      <DayDetailOverlay
        visible={overlayVisible}
        date={selectedDate}
        events={selectedEvents}
        onClose={() => setOverlayVisible(false)}
      />
    </div>
  );
}



