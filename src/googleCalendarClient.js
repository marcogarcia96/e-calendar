// src/googleCalendarClient.js

// Read from your .env (remember to restart dev server after editing .env)
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

/**
 * Dynamically load the Google API script once.
 */
export function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load gapi script"));
    document.body.appendChild(script);
  });
}

/**
 * Initialize the Google API client with Calendar.
 */
export async function initGapiClient() {
  if (!CLIENT_ID || !API_KEY) {
    console.warn(
      "[googleCalendarClient] Missing CLIENT_ID or API_KEY in .env (REACT_APP_GOOGLE_CLIENT_ID / REACT_APP_GOOGLE_API_KEY)"
    );
  }

  await loadGapiScript();

  return new Promise((resolve, reject) => {
    window.gapi.load("client:auth2", async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES,
        });
        resolve();
      } catch (err) {
        console.error("[googleCalendarClient] gapi.client.init error", err);
        reject(err);
      }
    });
  });
}

/**
 * Ensure the user is signed in; opens Google OAuth popup if needed.
 */
export async function ensureSignedIn() {
  const auth = window.gapi.auth2.getAuthInstance();
  if (!auth) {
    throw new Error("Google Auth instance not initialized");
  }

  if (auth.isSignedIn.get()) {
    return auth.currentUser.get();
  }

  const user = await auth.signIn();
  return user;
}

/**
 * Create an event in the user's primary Google Calendar.
 * Expects JS Date objects for start/end.
 */
export async function createGoogleCalendarEvent({ title, start, end }) {
  if (!window.gapi || !window.gapi.client) {
    await initGapiClient();
  }

  await ensureSignedIn();

  const event = {
    summary: title,
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
  };

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return response.result; // contains .id, .htmlLink, etc.
}

/**
 * Delete an event from the user's primary Google Calendar by eventId.
 */
export async function deleteGoogleCalendarEvent({ eventId }) {
  if (!eventId) {
    throw new Error("deleteGoogleCalendarEvent called without eventId");
  }

  if (!window.gapi || !window.gapi.client) {
    await initGapiClient();
  }

  await ensureSignedIn();

  await window.gapi.client.calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

