// src/components/TodoPanel.js
import React from "react";

export default function TodoPanel() {
  return (
    <div className="card todo-card">
      <div className="section-header">To-Do List</div>
      <ul className="todo-list">
        <li>
          <input type="checkbox" /> Example task
        </li>
        <li>
          <input type="checkbox" /> Another task
        </li>
        <li>
          <input type="checkbox" /> Example task
        </li>
        <li>
          <input type="checkbox" /> Another task
        </li>
      </ul>
    </div>
  );
}
