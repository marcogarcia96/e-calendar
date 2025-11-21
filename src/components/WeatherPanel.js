// src/components/WeatherPanel.js
// src/components/WeatherPanel.js
import React, { useEffect, useState } from "react";
import "./WeatherPanel.css";

const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;
const LAT = process.env.REACT_APP_LAT;
const LON = process.env.REACT_APP_LON;
const UNITS = "imperial"; // °F

function WeatherPanel({ onOpenForecast }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  async function loadWeather() {
    try {
      if (!API_KEY || !LAT || !LON) {
        throw new Error("Missing REACT_APP_OPENWEATHER_KEY / LAT / LON");
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=${UNITS}&appid=${API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const temp = Math.round(data.main.temp);
      const high = Math.round(data.main.temp_max);
      const low = Math.round(data.main.temp_min);
      const description = (data.weather[0]?.description || "").replace(
        /\b\w/g,
        (c) => c.toUpperCase()
      );
      const city = data.name || "Unknown location";

      setWeather({ temp, high, low, description, city });
      setError(null);
    } catch (err) {
      console.error("OpenWeather fetch error:", err);
      setError("Weather unavailable");
      setWeather(null);
    }
  }

  useEffect(() => {
    loadWeather();
    const id = setInterval(loadWeather, 20 * 60 * 1000); // every 20 min
    return () => clearInterval(id);
  }, []);

  const desc = weather?.description?.toLowerCase() || "";
  let emoji = "☀️";
  if (desc.includes("cloud")) emoji = "⛅️";
  if (desc.includes("rain")) emoji = "🌧️";
  if (desc.includes("storm") || desc.includes("thunder")) emoji = "⛈️";
  if (desc.includes("snow")) emoji = "❄️";
  if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze"))
    emoji = "🌫️";

  return (
    <div
      className="card weather-card"
      onClick={onOpenForecast}
      style={{ cursor: "pointer" }}
    >
      {/* ICON ON TOP */}
      <div className="weather-icon">
        <span className="weather-emoji">{emoji}</span>
      </div>

      {/* CITY / LOCATION */}
      <div className="weather-location">
        {weather ? weather.city : error ? "Error" : "Loading..."}
      </div>

      {/* BIG TEMPERATURE */}
      <div className="weather-temp">
        {weather ? `${weather.temp}°F` : "--"}
      </div>

      {/* DESCRIPTION */}
      <div className="weather-description">
        {weather ? weather.description : error || ""}
      </div>

      {/* HIGH / LOW ROW */}
      <div className="weather-hilo">
        <span>H: {weather ? `${weather.high}°` : "--"}</span>
        <span>L: {weather ? `${weather.low}°` : "--"}</span>
      </div>
    </div>
  );
}

export default WeatherPanel;



