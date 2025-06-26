const msal = require('@azure/msal-node');
const fetch = require('node-fetch');

module.exports = async function (context, req) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const workspaceId = process.env.WORKSPACE_ID;
  const reportId = process.env.REPORT_ID;

  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const scope = "https://analysis.windows.net/powerbi/api/.default";

  const config = {
    auth: {
      clientId,
      authority,
      clientSecret
    }
  };

  const cca = new msal.ConfidentialClientApplication(config);

  try {
    const result = await cca.acquireTokenByClientCredential({ scopes: [scope] });
    const accessToken = result.accessToken;

    context.res = {
      status: 200,
      body: {
        accessToken,
        reportId,
        workspaceId,
        tenantId
      }
    };
  } catch (error) {
    context.log('Token generation error:', error);
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};