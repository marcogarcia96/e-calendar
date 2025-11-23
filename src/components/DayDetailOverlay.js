// src/components/DayDetailOverlay.js
import React from "react";
import "./DayDetailOverlay.css";

function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export default function DayDetailOverlay({ visible, date, events, onClose }) {
  if (!visible || !date) return null;

  const headerDate = formatDate(date);

  return (
    <div className="day-overlay-backdrop" onClick={onClose}>
      <div
        className="day-overlay-modal"
        onClick={(e) => e.stopPropagation()} // keep clicks inside from closing
      >
        {/* X button INSIDE the dark modal */}
        <button
          type="button"
          className="day-overlay-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="day-overlay-header">
          <div className="day-overlay-date">{headerDate}</div>
        </div>

        <div className="day-overlay-divider" />

        <div className="day-overlay-body">
          {events && events.length > 0 ? (
            <ul className="day-overlay-event-list">
              {events.map((evt, idx) => (
                <li key={idx} className="day-overlay-event">
                  <div className="event-title">{evt.title}</div>
                  {evt.start && (
                    <div className="event-time">
                      {evt.start.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {evt.end &&
                        " – " +
                          evt.end.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="day-overlay-empty">No events for this day.</div>
          )}
        </div>
      </div>
    </div>
  );
}


