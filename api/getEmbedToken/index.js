const axios = require('axios');
const msal = require('@azure/msal-node');

const config = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: 'https://login.microsoftonline.com/' + process.env.TENANT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  }
};

const cca = new msal.ConfidentialClientApplication(config);

module.exports = async function (context, req) {
  try {
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    });

    const accessToken = tokenResponse.accessToken;
    const reportId = process.env.REPORT_ID;
    const groupId = process.env.WORKSPACE_ID;

    const embedTokenResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`,
      { accessLevel: 'View' },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    context.res = {
      headers: { 'Content-Type': 'application/json' },
      body: {
        embedToken: embedTokenResponse.data.token,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${groupId}`,
        reportId,
        accessToken: accessToken,
      },
    };
  } catch (err) {
    context.log('Token generation error:', err.message);
    context.res = {
      status: 500,
      body: { error: 'Failed to get embed token', details: err.message },
    };
  }
};
