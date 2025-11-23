import React from "react";
import "./NotesPanel.css";

export default function NotesPanel() {
  return (
    <div className="card notes-card">

      {/* Header row: Notes (left) + plus button (right) */}
      <div className="notes-header">
        <span className="notes-title">Notes</span>
        <button className="notes-add-btn">+</button>
      </div>

      {/* Divider line */}
      <div className="notes-divider"></div>

      {/* Your original content area stays unchanged */}
      <div className="notes-content"></div>

    </div>
  );
}