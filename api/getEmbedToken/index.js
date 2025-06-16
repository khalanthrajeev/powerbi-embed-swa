const axios = require('axios');

module.exports = async function (context, req) {
  context.log('Processing getEmbedToken request...');

  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const workspaceId = process.env.WORKSPACE_ID;
  const reportId = process.env.REPORT_ID;

  if (!tenantId || !clientId || !clientSecret || !workspaceId || !reportId) {
    context.log.error("Missing environment variables.");
    context.res = {
      status: 500,
      body: { error: "Missing environment variables." }
    };
    return;
  }

  try {
    // Get OAuth access token
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

    // Call Power BI GenerateToken API
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

    context.res = {
      status: 200,
      body: { embedToken }
    };

  } catch (err) {
    context.log.error("Embed token generation failed:", err.message);
    context.res = {
      status: 500,
      body: {
        error: err.message,
        details: err.response?.data || null,
        stack: err.stack
      }
    };
  }
};
