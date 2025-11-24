// src/components/DayDetailOverlay.js
import React, { useState, useEffect } from "react";
import "./DayDetailOverlay.css";

function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export default function DayDetailOverlay({
  visible,
  date,
  events,
  onClose,
  onAddEvent,
  onRemoveEvent,
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Reset inputs whenever you open the overlay / change day
  useEffect(() => {
    if (visible) {
      setTitle("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setNotes("");
    }
  }, [visible, date]);

  if (!visible || !date) return null;

  const headerDate = formatDate(date);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !onAddEvent) return;

    onAddEvent({
      title: title.trim(),
      startTime: startTime || null,
      endTime: endTime || null,
      location,
      notes,
    });

    // clear inputs after adding
    setTitle("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setNotes("");
  };

  const showDetails = title.trim().length > 0; // only show extra fields once user starts typing

  return (
    <div className="day-overlay-backdrop" onClick={onClose}>
      <div
        className="day-overlay-modal"
        onClick={(e) => e.stopPropagation()}
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
              {events.map((evt, idx) => {
                const notesText = (evt.description || evt.notes || "").trim();
                const locationText = (evt.location || "").trim();

                return (
                  <li key={idx} className="day-overlay-event">
                    <div className="day-overlay-event-main">
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

                      {locationText && (
                        <div className="event-location">{locationText}</div>
                      )}

                      {notesText && (
                        <div className="event-description">
                          {notesText}
                        </div>
                      )}

                      {/* Only show link for events created by this app */}
                      {evt.googleId && evt.url && (
                        <a
                          href={evt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="event-link"
                        >
                          Open in Google Calendar
                        </a>
                      )}
                    </div>

                    {onRemoveEvent && (
                      <button
                        type="button"
                        className="day-overlay-event-delete"
                        onClick={() => onRemoveEvent(evt)}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="day-overlay-empty">No events for this day.</div>
          )}

          {/* ----- Add new event form ----- */}
          <div
            className="day-overlay-divider"
            style={{ marginTop: 16, marginBottom: 12 }}
          />

          <form onSubmit={handleSubmit} className="day-overlay-add-form">
            {/* Title row */}
            <div className="day-overlay-add-row">
              <input
                type="text"
                className="day-overlay-input"
                placeholder="New event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Time range row */}
            <div className="day-overlay-add-row" style={{ marginTop: 8 }}>
              <input
                type="time"
                className="day-overlay-input day-overlay-input-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="day-overlay-time-separator">–</span>
              <input
                type="time"
                className="day-overlay-input day-overlay-input-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              <button
                type="submit"
                className="day-overlay-add-button"
              >
                Add
              </button>
            </div>

            {/* Details section appears once title is typed */}
            {showDetails && (
              <div className="day-overlay-details">
                <div className="day-overlay-add-row" style={{ marginTop: 10 }}>
                  <input
                    type="text"
                    className="day-overlay-input"
                    placeholder="Location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="day-overlay-add-row" style={{ marginTop: 8 }}>
                  <textarea
                    className="day-overlay-textarea"
                    placeholder="Notes / description (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
