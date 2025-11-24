// src/components/CalendarPanel.js
import React, { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ical from "ical.js";
import "./CalendarPanel.css";

import DayDetailOverlay from "./DayDetailOverlay";
import {
  initGapiClient,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "../googleCalendarClient";

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // ⏰ current time for toolbar
  const [currentTime, setCurrentTime] = useState("");

  // clock
  useEffect(() => {
    function updateClock() {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    }

    updateClock();
    const interval = setInterval(updateClock, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // optional: initialize gapi client once on mount (lazy init also works)
  useEffect(() => {
    initGapiClient().catch((err) =>
      console.error("Failed to init Google Calendar client:", err)
    );
  }, []);

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
              location: event.location || "",
              description: event.description || "",
              url: ve.getFirstPropertyValue("url") || null,
              googleId: null, // ICS events won't have our Google ID
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
    const clickedDate = info.date; // JS Date
    const iso = info.dateStr; // "YYYY-MM-DD"

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

  // 🔹 called from DayDetailOverlay when user adds an event
  const handleAddEventFromOverlay = async ({ title, startTime, endTime }) => {
    if (!selectedDate || !title.trim()) return;

    // Base date
    const start = new Date(selectedDate);

    // Apply chosen start time or default 9:00
    if (startTime) {
      const [h, m] = startTime.split(":");
      start.setHours(Number(h), Number(m), 0, 0);
    } else {
      start.setHours(9, 0, 0, 0); // default 9am
    }

    // Compute end
    let end = new Date(start);

    if (endTime) {
      const [eh, em] = endTime.split(":");
      end.setHours(Number(eh), Number(em), 0, 0);

      // if end <= start, bump 1 hour to avoid weird ranges
      if (end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
    } else {
      // no end time: default 1 hour long
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    let googleId = null;
    let htmlLink = null;

    // 1) Try to create the event in Google Calendar first
    try {
      const created = await createGoogleCalendarEvent({
        title: title.trim(),
        start,
        end,
      });
      googleId = created.id || null;
      htmlLink = created.htmlLink || null;
      console.log("✅ Created event in Google Calendar", created);
    } catch (err) {
      console.error("❌ Failed to create Google Calendar event:", err);
      // still add locally even if Google fails
    }

    const newEvent = {
      title: title.trim(),
      start,
      end,
      location: "",
      description: "",
      url: htmlLink, // use Google event link when we have it
      googleId,
    };

    // 2) Update local state so it shows immediately in your UI
    setEvents((prev) => [...prev, newEvent]);
    setSelectedEvents((prev) => [...prev, newEvent]);
  };

  // 🔹 called from DayDetailOverlay when user removes an event
  const handleRemoveEventFromOverlay = async (eventToRemove) => {
    // Remove from the selected-day list
    setSelectedEvents((prev) => prev.filter((evt) => evt !== eventToRemove));

    // Remove from the global events list
    setEvents((prev) => prev.filter((evt) => evt !== eventToRemove));

    // If this event has a Google ID, try deleting it from Google Calendar too
    if (eventToRemove.googleId) {
      try {
        await deleteGoogleCalendarEvent({ eventId: eventToRemove.googleId });
        console.log("🗑️ Deleted event from Google Calendar");
      } catch (err) {
        console.error("❌ Failed to delete Google Calendar event:", err);
      }
    }
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
          headerToolbar={{
            left: "title",
            center: "currentTime",
            right: "today prev,next",
          }}
          customButtons={{
            currentTime: {
              text: currentTime,
              click: () => {},
            },
          }}
        />
      </div>

      <DayDetailOverlay
        visible={overlayVisible}
        date={selectedDate}
        events={selectedEvents}
        onClose={() => setOverlayVisible(false)}
        onAddEvent={handleAddEventFromOverlay}
        onRemoveEvent={handleRemoveEventFromOverlay}
      />
    </div>
  );
}

