const axios = require("axios");
const msal = require("@azure/msal-node");

const OUTLOOK_SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.Read",
];

const getMsalClient = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    throw new Error(
      "MICROSOFT_CLIENT_ID et MICROSOFT_CLIENT_SECRET sont obligatoires"
    );
  }

  return new msal.ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });
};

const getOutlookRedirectUri = () => {
  return (
    process.env.MICROSOFT_REDIRECT_URI ||
    "http://localhost:3000/api/calendar-auth/outlook/callback"
  );
};

const getOutlookAuthUrl = async (state) => {
  const msalClient = getMsalClient();

  return msalClient.getAuthCodeUrl({
    scopes: OUTLOOK_SCOPES,
    redirectUri: getOutlookRedirectUri(),
    state,
  });
};

const getOutlookTokensFromCode = async (code) => {
  const msalClient = getMsalClient();

  const result = await msalClient.acquireTokenByCode({
    code,
    scopes: OUTLOOK_SCOPES,
    redirectUri: getOutlookRedirectUri(),
  });

  return {
    accessToken: result.accessToken || null,
    refreshToken: null,
    expiresAt: result.expiresOn ? result.expiresOn.getTime() : null,
    scope: OUTLOOK_SCOPES.join(" "),
    tokenType: "Bearer",
    accountEmail: result.account?.username || null,
  };
};

const getOutlookCalendarEvents = async ({
  accessToken,
  days = 7,
}) => {
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + Number(days));

  const startDateTime = now.toISOString();
  const endDateTime = maxDate.toISOString();

  const response = await axios.get(
    "https://graph.microsoft.com/v1.0/me/calendarView",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        startDateTime,
        endDateTime,
        "$orderby": "start/dateTime",
        "$top": 50,
      },
    }
  );

  const events = response.data.value || [];

  return events
    .filter((event) => event.start?.dateTime && event.end?.dateTime)
    .map((event) => ({
      externalEventId: event.id,
      title: event.subject || "Événement Outlook",
      startDateTime: event.start.dateTime,
      endDateTime: event.end.dateTime,
      raw: event,
    }));
};

module.exports = {
  getOutlookAuthUrl,
  getOutlookTokensFromCode,
  getOutlookCalendarEvents,
};