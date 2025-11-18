// src/components/NotesPanel.js
import React from "react";

export default function NotesPanel() {
  return (
    <div className="card notes-card">
      <div className="section-header">Notes</div>
      <textarea
        className="notes-textarea"
        placeholder="Write notes here..."
      />
    </div>
  );
}
