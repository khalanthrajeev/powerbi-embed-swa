const axios = require('axios');

module.exports = async function (context, req) {
  try {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID;
    const reportId = process.env.REPORT_ID;
    const workspaceId = process.env.WORKSPACE_ID;

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Return token and config
    context.res = {
      status: 200,
      body: {
        accessToken: accessToken,
        reportId: reportId,
        workspaceId: workspaceId,
        tenantId: tenantId,
        rawTokenResponse: tokenResponse.data,
      },
    };
  } catch (error) {
    context.log('Token generation error:', error.message);
    context.res = {
      status: 500,
      body: {
        error: 'Token generation failed',
        details: error.message,
      },
    };
  }
};
