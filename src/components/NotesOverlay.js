// src/components/NotesOverlay.js
import React, { useEffect, useState } from "react";
import "./NotesOverlay.css";

export default function NotesOverlay({
  isOpen,
  initialNote,
  onSave,
  onDelete,
  onCancel,
}) {
  // ✅ Hooks must always be called, even if we later return null
  const [title, setTitle] = useState(initialNote?.title || "");
  const [body, setBody] = useState(initialNote?.body || "");

  // when the note being edited changes, update local state
  useEffect(() => {
    setTitle(initialNote?.title || "");
    setBody(initialNote?.body || "");
  }, [initialNote]);

  // if overlay should not be visible, render nothing
  if (!isOpen || !initialNote) return null;

  const isExisting = initialNote.id != null;

  const handleSaveClick = () => {
    onSave({
      id: initialNote.id ?? null,
      title: title.trim(),
      body: body,
    });
  };

  const handleDeleteClick = () => {
    if (isExisting) {
      onDelete(initialNote.id);
    }
  };




  return (
    <div className="notes-overlay" >
      <div className="notes-modal" >
        {/* Title row */}
        <div className="notes-modal-header">
          <input
            className="notes-modal-title-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="notes-modal-divider" />

        {/* body textarea */}
        <textarea
          className="notes-modal-textarea"
          placeholder="Notes"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* buttons row */}
        <div className="notes-modal-actions">
          <div className="notes-modal-actions-left">
            {isExisting && (
              <button
                type="button"
                className="notes-btn notes-btn-danger"
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            )}
          </div>

          <div className="notes-modal-actions-right">
            <button
              type="button"
              className="notes-btn notes-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="notes-btn notes-btn-primary"
              onClick={handleSaveClick}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
