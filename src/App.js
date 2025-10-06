import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ical from "ical.js";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchAllCalendars = async () => {
      try {
        const urls = Object.keys(process.env)
          .filter((k) => k.startsWith("REACT_APP_ICAL_URL_"))
          .map((k) => process.env[k])
          .filter(Boolean);

        if (urls.length === 0) {
          console.error("❌ No calendar URLs found in .env");
          return;
        }

        const allEvents = [];

        for (const url of urls) {
          console.log(`Fetching calendar: ${url}`);
          const text = await window.calendar.fetchICS(url);
          const jcalData = ical.parse(text);
          const comp = new ical.Component(jcalData);
          const vevents = comp.getAllSubcomponents("vevent");

          const parsedEvents = vevents.map((event) => {
            const e = new ical.Event(event);
            return {
              title: e.summary || "Untitled Event",
              start: e.startDate.toJSDate(),
              end: e.endDate ? e.endDate.toJSDate() : e.startDate.toJSDate(),
              backgroundColor: url.includes("work")
                ? "#ff9f89"
                : "#8ad1ff", // color by calendar
            };
          });

          allEvents.push(...parsedEvents);
        }

        setEvents(allEvents);
        console.log(
          `✅ Loaded ${allEvents.length} total events at ${new Date().toLocaleTimeString()}`
        );
      } catch (err) {
        console.error("Error loading calendars:", err);
      }
    };

    // Initial fetch + hourly refresh
    fetchAllCalendars();
    const interval = setInterval(fetchAllCalendars, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="100vh"
      />
    </div>
  );
}

export default App;

