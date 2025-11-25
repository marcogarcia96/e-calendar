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

export default function CalendarPanel({ onClockClick }) {
  const [events, setEvents] = useState([]);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const [currentTime, setCurrentTime] = useState("");

  // ⏰ clock in header
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

  // Initialize Google Calendar client (safe; will no-op if env vars missing)
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
              // ICS events are read-only, so no googleId here
              googleId: null,
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
    const clickedDate = info.date;
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

  // When an event pill is clicked, open overlay for that date
  const handleEventClick = (info) => {
    if (info.jsEvent) {
      info.jsEvent.preventDefault();
      info.jsEvent.stopPropagation();
    }

    const eventDate = info.event.start;
    if (!eventDate) return;

    const y = eventDate.getFullYear();
    const m = String(eventDate.getMonth() + 1).padStart(2, "0");
    const da = String(eventDate.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${da}`;

    const todaysEvents = events.filter((evt) => {
      const d = evt.start;
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}` === iso;
    });

    setSelectedDate(eventDate);
    setSelectedEvents(todaysEvents);
    setOverlayVisible(true);
  };

  // 🔹 add event from overlay (and push to Google)
  const handleAddEventFromOverlay = async ({
    title,
    startTime,
    endTime,
    location,
    notes,
  }) => {
    if (!selectedDate || !title.trim()) return;

    const start = new Date(selectedDate);

    // start time
    if (startTime) {
      const [h, m] = startTime.split(":");
      start.setHours(Number(h), Number(m), 0, 0);
    } else {
      start.setHours(9, 0, 0, 0);
    }

    // end time
    let end = new Date(start);
    if (endTime) {
      const [eh, em] = endTime.split(":");
      end.setHours(Number(eh), Number(em), 0, 0);
      if (end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    const cleanLocation = (location || "").trim();
    const cleanDescription = (notes || "").trim();

    let googleId = null;
    let htmlLink = null;

    try {
      const created = await createGoogleCalendarEvent({
        title: title.trim(),
        start,
        end,
        location: cleanLocation || undefined,
        description: cleanDescription || undefined,
      });

      googleId = created.id || null;
      htmlLink = created.htmlLink || null;
      console.log("✅ Created Google event:", created);
    } catch (err) {
      console.error("❌ Failed to create Google event:", err);
    }

    const newEvent = {
      title: title.trim(),
      start,
      end,
      location: cleanLocation,
      description: cleanDescription,
      url: htmlLink,
      googleId,
    };

    setEvents((prev) => [...prev, newEvent]);
    setSelectedEvents((prev) => [...prev, newEvent]);
  };

  // 🔹 remove event from overlay (and from Google if possible)
  const handleRemoveEventFromOverlay = async (eventToRemove) => {
    // Remove from local UI
    setEvents((prev) => prev.filter((evt) => evt !== eventToRemove));
    setSelectedEvents((prev) => prev.filter((evt) => evt !== eventToRemove));

    // Only delete from Google if we have a googleId (ICS events won't)
    if (eventToRemove.googleId) {
      try {
        await deleteGoogleCalendarEvent({ eventId: eventToRemove.googleId });
        console.log("✅ Deleted event from Google Calendar");
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
          contentHeight="100%"
          expandRows={true}
          fixedWeekCount={true}
          dayMaxEventRows={true}
          dayMaxEvents={3}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "title",
            center: "currentTime",
            right: "today prev,next",
          }}
          customButtons={{
            currentTime: {
              text: currentTime,
              click: () => {
                // 👇 THIS is what should open the clock overlay
                if (onClockClick) onClockClick();
              },
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



