const axios = require('axios');

module.exports = async function (context, req) {
  context.log('🔵 Starting Power BI Embed Token Generation');

  const { TENANT_ID, CLIENT_ID, CLIENT_SECRET, WORKSPACE_ID, REPORT_ID } = process.env;

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !WORKSPACE_ID || !REPORT_ID) {
    context.log.error("❌ Missing one or more environment variables.");
    context.res = {
      status: 500,
      body: { error: "Missing environment variables." }
    };
    return;
  }

  try {
    context.log("🔐 Requesting Azure AD Token...");
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://analysis.windows.net/powerbi/api/.default'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    context.log("✅ Azure AD Token acquired.");

    context.log("📊 Requesting Power BI Embed Token...");
    const embedResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${WORKSPACE_ID}/reports/${REPORT_ID}/GenerateToken`,
      { accessLevel: 'view' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const embedToken = embedResponse.data.token;
    context.log("✅ Embed Token generated.");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { embedToken }
    };
  } catch (err) {
    context.log.error("❌ Token generation failed.");
    context.log.error("Message:", err.message);
    context.log.error("Stack:", err.stack);

    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: err.message, stack: err.stack }
    };
  }
};
