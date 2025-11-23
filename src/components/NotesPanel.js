// src/components/NotesPanel.js
import React, { useEffect, useState } from "react";
import "./NotesOverlay.css"; // for modal
import "./NotesPanel.css";   // for panel styling

import NotesOverlay from "./NotesOverlay";

export default function NotesPanel() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Load notes from SQLite
  const loadNotes = async () => {
    try {
      if (!window.notesAPI) {
        console.error("notesAPI is not available (Electron preload not loaded)");
        return;
      }
      const rows = await window.notesAPI.list(); // [{id, title, updated_at}, ...]
      setNotes(rows);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Open blank note (for +)
  const openNewNote = () => {
    setActiveNote({ id: null, title: "", body: "" });
    setIsOverlayOpen(true);
  };

  // Open existing note (need to fetch full body from DB)
  const openExistingNote = async (id) => {
    try {
      const full = await window.notesAPI.get(id);
      if (full) {
        setActiveNote({
          id: full.id,
          title: full.title,
          body: full.body,
        });
        setIsOverlayOpen(true);
      }
    } catch (err) {
      console.error("Failed to load note:", err);
    }
  };

  // Save handler from overlay
  const handleSave = async (note) => {
    try {
      const savedId = await window.notesAPI.save(note);
      // reload list so titles are up-to-date
      await loadNotes();
      setIsOverlayOpen(false);
      setActiveNote(null);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  // Delete handler from overlay
  const handleDelete = async (id) => {
    try {
      await window.notesAPI.delete(id);
      await loadNotes();
      setIsOverlayOpen(false);
      setActiveNote(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleCancel = () => {
    setIsOverlayOpen(false);
    setActiveNote(null);
  };

  return (
    <>
      <div className="card notes-card">
        {/* Header row: NOTES + plus button + line */}
        <div className="notes-header-row">
          <div className="notes-title-text">NotePad++ </div>
          <button
            className="notes-add-btn"
            type="button"
            onClick={openNewNote}
          >
            +
          </button>
        </div>
        <div className="notes-header-line" />

        {/* List of note titles on main dashboard */}
        <div className="notes-list">
          {notes.length === 0 && (
            <div className="notes-empty">No notes yet</div>
          )}

          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="note-pill"
              onClick={() => openExistingNote(note.id)}
            >
              {note.title || "Untitled note"}
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen notes editor overlay */}
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
