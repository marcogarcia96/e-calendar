// src/googleCalendarClient.js

// NOTE: This version uses **Google Identity Services (GIS)**
// instead of the deprecated gapi.auth2 flow.

/* global gapi */

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];

// Scope: read/write events on your calendar
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let gapiLoaded = false;
let gapiInitPromise = null;
let gapiScriptPromise = null;

let gisLoaded = false;
let gisScriptPromise = null;
let tokenClient = null;
let accessToken = null;
let accessTokenPromise = null;

/**
 * Load the Google API script (gapi) once.
 */
function loadGapiScript() {
  if (gapiScriptPromise) return gapiScriptPromise;

  gapiScriptPromise = new Promise((resolve, reject) => {
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
          new Error("gapi script loaded, but window.gapi.load is not available")
        );
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google API (gapi) script"));
    };

    document.body.appendChild(script);
  });

  return gapiScriptPromise;
}

/**
 * Load the Google Identity Services script (GIS) once.
 */
function loadGisScript() {
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    if (
      window.google &&
      window.google.accounts &&
      window.google.accounts.oauth2
    ) {
      gisLoaded = true;
      resolve(window.google.accounts.oauth2);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.oauth2
      ) {
        gisLoaded = true;
        resolve(window.google.accounts.oauth2);
      } else {
        reject(
          new Error(
            "GIS script loaded, but window.google.accounts.oauth2 is not available"
          )
        );
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Identity Services script"));
    };

    document.body.appendChild(script);
  });

  return gisScriptPromise;
}

/**
 * Initialize the gapi client (Calendar discovery).
 * No auth here, just API key + discovery docs.
 */
export async function initGapiClient() {
  if (gapiLoaded) return;
  if (gapiInitPromise) return gapiInitPromise;

  gapiInitPromise = (async () => {
    const g = await loadGapiScript();

    // Load the 'client' module
    await new Promise((resolve, reject) => {
      g.load("client", {
        callback: resolve,
        onerror: () => reject(new Error("gapi.load('client') failed")),
        timeout: 5000,
        ontimeout: () => reject(new Error("gapi.load('client') timed out")),
      });
    });

    await g.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
      // ⚠️ no clientId / scope here – auth handled by GIS
    });

    gapiLoaded = true;
    console.log("[GoogleCalendar] gapi client initialized (no auth yet)");
  })();

  return gapiInitPromise;
}

/**
 * Ensure we have a valid access token using GIS.
 * This handles sign-in/consent and sets the token on gapi.client.
 */
async function ensureAccessToken() {
  await initGapiClient();
  await loadGisScript();

  if (accessToken) {
    // We have a token already; in a real app you'd check expiry.
    return accessToken;
  }

  if (accessTokenPromise) {
    return accessTokenPromise;
  }

  accessTokenPromise = new Promise((resolve, reject) => {
    try {
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              accessToken = tokenResponse.access_token;
              if (window.gapi && window.gapi.client) {
                window.gapi.client.setToken({ access_token: accessToken });
              }
              console.log("[GoogleCalendar] GIS token acquired");
              accessTokenPromise = null;
              resolve(accessToken);
            } else {
              accessTokenPromise = null;
              reject(new Error("No access token in GIS response"));
            }
          },
        });
      }

      // First time: prompt=consent.
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err) {
      accessTokenPromise = null;
      reject(err);
    }
  });

  return accessTokenPromise;
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
  await ensureAccessToken();
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

  console.log("[GoogleCalendar] Created event:", response.result);
  return response.result;
}

/**
 * Delete a Google Calendar event by its ID.
 */
export async function deleteGoogleCalendarEvent({ eventId }) {
  if (!eventId) return;

  await ensureAccessToken();
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

/**
 * 🆕 ADDED THIS FUNCTION
 * Fetch upcoming events directly from Google Calendar API.
 * This provides the real 'id' needed for deletion.
 */
export async function listGoogleCalendarEvents() {
  await ensureAccessToken();
  const g = window.gapi;

  // Calculate time range (e.g., from 1 month ago to future)
  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 1);

  const response = await g.client.calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 250,
    orderBy: "startTime",
  });

  const items = response.result.items || [];

  return items.map((item) => {
    // Handle all-day events (date) vs timed events (dateTime)
    const start = item.start.dateTime || item.start.date;
    const end = item.end.dateTime || item.end.date;

    return {
      title: item.summary || "No Title",
      start: new Date(start),
      end: new Date(end),
      location: item.location,
      description: item.description,
      // We now save the ID so we can delete it later
      googleId: item.id,
      url: item.htmlLink,
    };
  });
}


