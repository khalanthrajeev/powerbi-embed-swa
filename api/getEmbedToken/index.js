const axios = require('axios');

module.exports = async function (context, req) {
  context.log('🔵 Starting Power BI Embed Token Generation');

  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const workspaceId = process.env.WORKSPACE_ID;
  const reportId = process.env.REPORT_ID;

  if (!tenantId || !clientId || !clientSecret || !workspaceId || !reportId) {
    context.log.error("❌ Missing environment variables.");
    context.res = {
      status: 500,
      body: { error: "Missing environment variables." }
    };
    return;
  }

  try {
    context.log("🔐 Requesting Azure AD Token...");
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    context.log("✅ Azure AD Token received.");

    context.log("📡 Requesting Embed Token from Power BI...");
    const embedResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      { accessLevel: 'view' },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const embedToken = embedResponse.data.token;
    context.log("✅ Embed Token generated successfully.");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { embedToken }
    };

  } catch (err) {
    context.log.error("❌ Error details:", err.response?.data || err.message);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        message: "Embed token generation failed.",
        error: err.message,
        response: err.response?.data || null
      }
    };
  }
};
