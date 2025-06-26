const axios = require('axios');
const msal = require('@azure/msal-node');

module.exports = async function (context, req) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const reportId = process.env.REPORT_ID;
  const workspaceId = process.env.WORKSPACE_ID;

  const authority = `https://login.microsoftonline.com/${tenantId}`;

  const msalConfig = {
    auth: {
      clientId,
      authority,
      clientSecret
    }
  };

  const cca = new msal.ConfidentialClientApplication(msalConfig);

  try {
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    });

    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('Access token not retrieved from Azure AD.');
    }

    const embedTokenResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      { accessLevel: 'View' },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    context.res = {
      status: 200,
      body: {
        embedToken: embedTokenResponse.data.token,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
        reportId
      }
    };
  } catch (error) {
    context.log('❌ Error occurred:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        details: error.response?.data || 'No additional error info from API',
      })
    };
  }
};
