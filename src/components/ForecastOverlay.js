// src/components/ForecastOverlay.js
import React, { useEffect, useState } from "react";
import "./ForecastOverlay.css";

const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;
const LAT = process.env.REACT_APP_LAT;
const LON = process.env.REACT_APP_LON;
const UNITS = "imperial"; // °F

function emojiFor(desc = "") {
  const d = desc.toLowerCase();
  if (d.includes("storm") || d.includes("thunder")) return "⛈️";
  if (d.includes("rain")) return "🌧️";
  if (d.includes("snow")) return "❄️";
  if (d.includes("cloud")) return "⛅️";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "🌫️";
  return "☀️";
}

function ForecastOverlay({ onClose }) {
  const [days, setDays] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      try {
        if (!API_KEY || !LAT || !LON) {
          throw new Error("Missing REACT_APP_WEATHERAPI_KEY / LAT / LON");
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=${UNITS}&appid=${API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Group 3-hour entries by date
        const byDate = {};
        data.list.forEach((item) => {
          const dt = new Date(item.dt * 1000);
          const key = dt.toISOString().slice(0, 10); // YYYY-MM-DD
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(item);
        });

        const dayKeys = Object.keys(byDate).sort().slice(0, 5);
        const result = dayKeys.map((key) => {
          const slots = byDate[key];
          const tempsMax = slots.map((s) => s.main.temp_max);
          const tempsMin = slots.map((s) => s.main.temp_min);
          const high = Math.round(Math.max(...tempsMax));
          const low = Math.round(Math.min(...tempsMin));

          const mid = slots[Math.floor(slots.length / 2)];
          const temp = Math.round(mid.main.temp);
          const desc = (mid.weather[0]?.description || "").replace(
            /\b\w/g,
            (c) => c.toUpperCase()
          );

          return {
            date: new Date(key),
            temp,
            high,
            low,
            desc,
          };
        });

        setDays(result);
        setError("");
      } catch (err) {
        console.error("Forecast fetch error:", err);
        setError("Could not load forecast");
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  return (
    <div className="forecast-overlay" onClick={onClose}>
      <div
        className="forecast-modal"
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        <div className="forecast-header">
          <h2>{process.env.REACT_APP_LOCATION_NAME || "Forecast"}</h2>

          <div className="forecast-subtitle">
            5-Day Outlook
          </div>
        </div>

        {loading && <div className="forecast-loading">Loading…</div>}
        {error && !loading && (
          <div className="forecast-error">{error}</div>
        )}

        {!loading && !error && (
          <div className="forecast-cards">
            {days.map((day) => (
              <div
                key={day.date.toISOString()}
                className="forecast-card"
              >
                <div className="forecast-day">
                  {day.date.toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </div>
                <div className="forecast-emoji">
                  {emojiFor(day.desc)}
                </div>
                <div className="forecast-temp">{day.temp}°F</div>
                <div className="forecast-desc">{day.desc}</div>
                <div className="forecast-hi-lo">
                  H: {day.high}° • L: {day.low}°
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForecastOverlay;


