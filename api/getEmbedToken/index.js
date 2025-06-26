const axios = require("axios");
const msal = require("@azure/msal-node");

module.exports = async function (context, req) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const workspaceId = process.env.WORKSPACE_ID;
  const reportId = process.env.REPORT_ID;

  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const msalConfig = {
    auth: {
      clientId,
      authority,
      clientSecret,
    },
  };

  const cca = new msal.ConfidentialClientApplication(msalConfig);

  try {
    const result = await cca.acquireTokenByClientCredential({
      scopes: ["https://analysis.windows.net/powerbi/api/.default"],
    });

    const accessToken = result.accessToken;

    const embedResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      { accessLevel: "View" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      }
    );

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: {
        status: "success",
        accessToken: embedResponse.data.token,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
        reportId,
      },
    };
  } catch (err) {
    // Return full error details in response
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        status: "error",
        message: err.message || "Unexpected error",
        stack: err.stack || null,
        response: err.response?.data || null,
        config: err.config || null
      },
    };
  }
};
