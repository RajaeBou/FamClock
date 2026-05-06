const { google } = require("googleapis");

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/calendar-auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont obligatoires");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const getGoogleAuthUrl = (state) => {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
  });
};

const getGoogleTokensFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  let accountEmail = null;

  try {
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    accountEmail = userInfo.data.email || null;
  } catch (error) {
    console.warn("Impossible de récupérer l'email Google :", error.message);
  }

  return {
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date || null,
    scope: tokens.scope || GOOGLE_SCOPES.join(" "),
    tokenType: tokens.token_type || "Bearer",
    accountEmail,
  };
};

const getGoogleCalendarEvents = async ({
  accessToken,
  refreshToken,
  days = 7,
}) => {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + Number(days));

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: maxDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  return events
    .filter((event) => event.start?.dateTime && event.end?.dateTime)
    .map((event) => ({
      externalEventId: event.id,
      title: event.summary || "Événement Google Calendar",
      startDateTime: event.start.dateTime,
      endDateTime: event.end.dateTime,
      raw: event,
    }));
};

module.exports = {
  getGoogleAuthUrl,
  getGoogleTokensFromCode,
  getGoogleCalendarEvents,
};