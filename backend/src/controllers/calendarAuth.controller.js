const db = require("../config/db");
const {
  getGoogleAuthUrl,
  getGoogleTokensFromCode,
  getGoogleCalendarEvents,
} = require("../services/googleCalendar.service");

const {
  getOutlookAuthUrl,
  getOutlookTokensFromCode,
  getOutlookCalendarEvents,
} = require("../services/outlookCalendar.service");

const { importCalendarEventsIntoSchedule } = require("../services/calendarImport.service");

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const ensureCalendarConnectionSchema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS calendar_connections (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      scope TEXT,
      token_type TEXT,
      account_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(family_id, provider)
    )
  `);
};

const createId = () => {
  return `calendar_connection_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
};

const encodeState = (data) => {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
};

const decodeState = (state) => {
  return JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
};

const saveConnection = async ({
  familyId,
  provider,
  accessToken,
  refreshToken,
  expiresAt,
  scope,
  tokenType,
  accountEmail,
}) => {
  await ensureCalendarConnectionSchema();

  const now = new Date().toISOString();

  const existing = await get(
    `
      SELECT *
      FROM calendar_connections
      WHERE family_id = ?
        AND provider = ?
    `,
    [familyId, provider]
  );

  if (!existing) {
    await run(
      `
        INSERT INTO calendar_connections (
          id,
          family_id,
          provider,
          access_token,
          refresh_token,
          expires_at,
          scope,
          token_type,
          account_email,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        createId(),
        familyId,
        provider,
        accessToken || null,
        refreshToken || null,
        expiresAt || null,
        scope || null,
        tokenType || null,
        accountEmail || null,
        now,
        now,
      ]
    );

    return;
  }

  await run(
    `
      UPDATE calendar_connections
      SET access_token = ?,
          refresh_token = COALESCE(?, refresh_token),
          expires_at = ?,
          scope = ?,
          token_type = ?,
          account_email = ?,
          updated_at = ?
      WHERE family_id = ?
        AND provider = ?
    `,
    [
      accessToken || null,
      refreshToken || null,
      expiresAt || null,
      scope || null,
      tokenType || null,
      accountEmail || null,
      now,
      familyId,
      provider,
    ]
  );
};

const getConnection = async (familyId, provider) => {
  await ensureCalendarConnectionSchema();

  return get(
    `
      SELECT *
      FROM calendar_connections
      WHERE family_id = ?
        AND provider = ?
    `,
    [familyId, provider]
  );
};

const redirectAfterOAuth = (provider, success = true) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const url = `${frontendUrl}/planning?provider=${provider}&connected=${success ? "true" : "false"}`;

  return url;
};

const getCalendarConnectionStatus = async (req, res) => {
  try {
    await ensureCalendarConnectionSchema();

    const { familyId } = req.params;

    const rows = await all(
      `
        SELECT provider, account_email, updated_at
        FROM calendar_connections
        WHERE family_id = ?
      `,
      [familyId]
    );

    const google = rows.find((row) => row.provider === "google") || null;
    const outlook = rows.find((row) => row.provider === "outlook") || null;

    return res.json({
      success: true,
      connections: {
        google: {
          connected: Boolean(google),
          accountEmail: google?.account_email || null,
          updatedAt: google?.updated_at || null,
        },
        outlook: {
          connected: Boolean(outlook),
          accountEmail: outlook?.account_email || null,
          updatedAt: outlook?.updated_at || null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur statut connexion calendrier :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut calendrier",
    });
  }
};

const connectGoogle = (req, res) => {
  try {
    const { familyId } = req.query;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        message: "familyId est obligatoire",
      });
    }

    const state = encodeState({
      familyId,
      provider: "google",
    });

    const authUrl = getGoogleAuthUrl(state);

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Erreur connexion Google :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion Google Calendar",
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(redirectAfterOAuth("google", false));
    }

    const decodedState = decodeState(state);
    const familyId = decodedState.familyId;

    const tokenResult = await getGoogleTokensFromCode(code);

    await saveConnection({
      familyId,
      provider: "google",
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      expiresAt: tokenResult.expiresAt,
      scope: tokenResult.scope,
      tokenType: tokenResult.tokenType,
      accountEmail: tokenResult.accountEmail,
    });

    return res.redirect(redirectAfterOAuth("google", true));
  } catch (error) {
    console.error("Erreur callback Google :", error.message);

    return res.redirect(redirectAfterOAuth("google", false));
  }
};

const importGoogleEvents = async (req, res) => {
  try {
    const {
      familyId,
      memberId,
      positionId,
      days = 7,
    } = req.body;

    if (!familyId || !memberId || !positionId) {
      return res.status(400).json({
        success: false,
        message: "familyId, memberId et positionId sont obligatoires",
      });
    }

    const connection = await getConnection(familyId, "google");

    if (!connection) {
      return res.status(400).json({
        success: false,
        message: "Google Calendar n'est pas encore connecté",
      });
    }

    const events = await getGoogleCalendarEvents({
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      days,
    });

    const result = await importCalendarEventsIntoSchedule({
      familyId,
      memberId,
      positionId,
      provider: "google",
      events,
    });

    return res.json({
      success: true,
      message: "Événements Google importés",
      imported: result.imported,
      skipped: result.skipped,
      conflicts: result.conflicts,
    });
  } catch (error) {
    console.error("Erreur import Google :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'import Google Calendar",
      error: error.message,
    });
  }
};

const connectOutlook = (req, res) => {
  try {
    const { familyId } = req.query;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        message: "familyId est obligatoire",
      });
    }

    const state = encodeState({
      familyId,
      provider: "outlook",
    });

    const authUrl = getOutlookAuthUrl(state);

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Erreur connexion Outlook :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion Outlook",
    });
  }
};

const outlookCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(redirectAfterOAuth("outlook", false));
    }

    const decodedState = decodeState(state);
    const familyId = decodedState.familyId;

    const tokenResult = await getOutlookTokensFromCode(code);

    await saveConnection({
      familyId,
      provider: "outlook",
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      expiresAt: tokenResult.expiresAt,
      scope: tokenResult.scope,
      tokenType: tokenResult.tokenType,
      accountEmail: tokenResult.accountEmail,
    });

    return res.redirect(redirectAfterOAuth("outlook", true));
  } catch (error) {
    console.error("Erreur callback Outlook :", error.message);

    return res.redirect(redirectAfterOAuth("outlook", false));
  }
};

const importOutlookEvents = async (req, res) => {
  try {
    const {
      familyId,
      memberId,
      positionId,
      days = 7,
    } = req.body;

    if (!familyId || !memberId || !positionId) {
      return res.status(400).json({
        success: false,
        message: "familyId, memberId et positionId sont obligatoires",
      });
    }

    const connection = await getConnection(familyId, "outlook");

    if (!connection) {
      return res.status(400).json({
        success: false,
        message: "Outlook n'est pas encore connecté",
      });
    }

    const events = await getOutlookCalendarEvents({
      accessToken: connection.access_token,
      days,
    });

    const result = await importCalendarEventsIntoSchedule({
      familyId,
      memberId,
      positionId,
      provider: "outlook",
      events,
    });

    return res.json({
      success: true,
      message: "Événements Outlook importés",
      imported: result.imported,
      skipped: result.skipped,
      conflicts: result.conflicts,
    });
  } catch (error) {
    console.error("Erreur import Outlook :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'import Outlook",
      error: error.message,
    });
  }
};

module.exports = {
  getCalendarConnectionStatus,
  connectGoogle,
  googleCallback,
  importGoogleEvents,
  connectOutlook,
  outlookCallback,
  importOutlookEvents,
};