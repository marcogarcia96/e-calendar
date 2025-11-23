// src/components/NotesPanel.js
import React, { useState } from "react";
import "./NotesOverlay.css"; // styles for the full-screen editor

import NotesOverlay from "./NotesOverlay";

export default function NotesPanel() {
  // simple in-memory notes – you can later replace with localStorage / DB
  const [notes, setNotes] = useState([
    { id: 1, title: "Class notes", body: "" },
    { id: 2, title: "Passwords", body: "" },
    { id: 3, title: "Job notes", body: "" },
  ]);

  const [activeNote, setActiveNote] = useState(null); // {id,title,body} or null
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const openNewNote = () => {
    setActiveNote({ id: null, title: "", body: "" }); // blank slate
    setIsOverlayOpen(true);
  };

  const openExistingNote = (note) => {
    setActiveNote(note);
    setIsOverlayOpen(true);
  };

  const handleSave = (updatedNote) => {
    if (!updatedNote.title.trim() && !updatedNote.body.trim()) {
      // nothing typed – just close without saving
      setIsOverlayOpen(false);
      setActiveNote(null);
      return;
    }

    if (updatedNote.id == null) {
      // new note
      const newNote = { ...updatedNote, id: Date.now() };
      setNotes((prev) => [...prev, newNote]);
    } else {
      // edit existing
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );
    }

    setIsOverlayOpen(false);
    setActiveNote(null);
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setIsOverlayOpen(false);
    setActiveNote(null);
  };

  const handleCancel = () => {
    setIsOverlayOpen(false);
    setActiveNote(null);
  };

  return (
    <>
      <div className="card notes-card">
        {/* top bar: NOTES + plus button + underline */}
        <div className="notes-header-row">
          <div className="notes-title-text">NOTES</div>
          <button
            className="notes-add-btn"
            type="button"
            onClick={openNewNote}
          >
            +
          </button>
        </div>
        <div className="notes-header-line" />

        {/* list of note “pills” */}
        <div className="notes-list">
          {notes.length === 0 && (
            <div className="notes-empty">No notes yet</div>
          )}

          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="note-pill"
              onClick={() => openExistingNote(note)}
            >
              {note.title || "Untitled note"}
            </button>
          ))}
        </div>
      </div>

      {/* full-screen editor overlay */}
      <NotesOverlay
        isOpen={isOverlayOpen}
        initialNote={activeNote}
        onSave={handleSave}
        onDelete={handleDelete}
        onCancel={handleCancel}
      />
    </>
  );
}
