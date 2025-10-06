// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ical from "ical.js";
import "./App.css";

/* ---------- Sci-Fi HUD Header ---------- */
function HudHeader({ date }) {
  const monthText = useMemo(
    () => date.toLocaleString(undefined, { month: "long" }).toUpperCase(),
    [date]
  );
  const y = String(date.getFullYear());
  const yearLeft = y.slice(0, 2);
  const yearRight = y.slice(2);

  return (
    <div className="hud">
      <div className="hud__yearchips">
        <div className="chip">{yearLeft}</div>
        <div className="chip">{yearRight}</div>
      </div>

      <div className="hud__title">
        <span className="hud__month">{monthText}</span>
        <span className="hud__underscore">_</span>
      </div>

      <div className="hud__meta">
        <span>DOWNLOADING…</span>
        <div className="hud__progress">
          <div className="bar" />
        </div>
        <span className="hud__file">FILE: 63</span>
      </div>
    </div>
  );
}

/* ---------- Main App Component ---------- */
export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Collect all ICS URLs from your .env
  const icsUrls = useMemo(() => {
    const keys = Object.keys(process.env);
    const list = [];
    if (process.env.REACT_APP_ICAL_URL) list.push(process.env.REACT_APP_ICAL_URL);
    keys
      .filter((k) => k.startsWith("REACT_APP_ICAL_URL_"))
      .sort()
      .forEach((k) => process.env[k] && list.push(process.env[k]));
    return list;
  }, []);

  useEffect(() => {
    const fetchAllCalendars = async () => {
      try {
        if (!icsUrls.length) {
          console.error("❌ No ICS URLs found in .env");
          setEvents([]);
          return;
        }

        const combined = [];
        for (const url of icsUrls) {
          const text = await window.calendar.fetchICS(url);
          const jcal = ical.parse(text);
          const comp = new ical.Component(jcal);
          const vevents = comp.getAllSubcomponents("vevent");

          vevents.forEach((ve) => {
            const e = new ical.Event(ve);
            const start = e.startDate?.toJSDate?.() ?? null;
            const end =
              e.endDate?.toJSDate?.() ??
              (start ? new Date(start.getTime()) : null);

            const color =
              url.toLowerCase().includes("work") ? "#ff9f89" : "#8ad1ff";

            if (start) {
              combined.push({
                title: e.summary || "Untitled Event",
                start,
                end,
                backgroundColor: color,
              });
            }
          });
        }

        setEvents(combined);
        console.log(
          `✅ Loaded ${combined.length} events @ ${new Date().toLocaleTimeString()}`
        );
      } catch (err) {
        console.error("ICS load error:", err);
        setEvents([]);
      }
    };

    fetchAllCalendars();
    const interval = setInterval(fetchAllCalendars, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [icsUrls]);

  /* ---------- RETURN: what renders on screen ---------- */
  return (
    <div className="App app-frame">
      <HudHeader date={currentDate} />
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="calc(100vh - 160px)"        // leaves room for the HUD
        dayHeaderClassNames={() => ["fc-dayHeader-sci"]}
        datesSet={(arg) => setCurrentDate(arg.start)} // sync HUD month
        
      />
    </div>
  );
}

