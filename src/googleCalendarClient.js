// src/googleCalendarClient.js
/* global gapi */

// From your .env
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let gapiInitialized = false;
let gapiInitPromise = null;
let gapiLoadPromise = null;

/**
 * Load the gapi script once and return window.gapi
 */
function loadGapi() {
  if (gapiLoadPromise) return gapiLoadPromise;

  gapiLoadPromise = new Promise((resolve, reject) => {
    // If gapi is already present and has .load, use it
    if (window.gapi && typeof window.gapi.load === "function") {
      resolve(window.gapi);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.gapi && typeof window.gapi.load === "function") {
        resolve(window.gapi);
      } else {
        reject(
          new Error("gapi script loaded but window.gapi.load is not available")
        );
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google API (gapi) script"));
    };

    document.body.appendChild(script);
  });

  return gapiLoadPromise;
}

/**
 * Initialize the gapi client + auth once.
 */
export async function initGapiClient() {
  if (gapiInitialized) return;
  if (gapiInitPromise) return gapiInitPromise;

  gapiInitPromise = (async () => {
    const g = await loadGapi();

    // ⬇️ THIS is what was missing: actually load "client:auth2"
    await new Promise((resolve, reject) => {
      g.load("client:auth2", {
        callback: resolve,
        onerror: () => reject(new Error("gapi.load('client:auth2') failed")),
        timeout: 5000,
        ontimeout: () =>
          reject(new Error("gapi.load('client:auth2') timed out")),
      });
    });

    // Now g.client exists and we can init safely
    await g.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });

    const auth = g.auth2.getAuthInstance();
    if (!auth.isSignedIn.get()) {
      await auth.signIn();
    }

    gapiInitialized = true;
    console.log("[GoogleCalendar] gapi client initialized");
  })();

  return gapiInitPromise;
}

/**
 * Create a Google Calendar event.
 * Returns the created event object (with id + htmlLink).
 */
export async function createGoogleCalendarEvent({
  title,
  start,
  end,
  location,
  description,
}) {
  await initGapiClient();
  const g = window.gapi;

  const event = {
    summary: title,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };

  if (location) event.location = location;
  if (description) event.description = description;

  const response = await g.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  // response.result has id, htmlLink…
  return response.result;
}

/**
 * Delete a Google Calendar event by its ID.
 */
export async function deleteGoogleCalendarEvent({ eventId }) {
  if (!eventId) return;

  await initGapiClient();
  const g = window.gapi;

  try {
    await g.client.calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
    console.log("[GoogleCalendar] Deleted event:", eventId);
  } catch (err) {
    console.error("[GoogleCalendar] Failed to delete:", eventId, err);
    throw err;
  }
}


