const { ClientSecretCredential } = require("@azure/identity");
const fetch = require("node-fetch");

const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const workspaceId = process.env.WORKSPACE_ID;
const reportId = process.env.REPORT_ID;

module.exports = async function (context, req) {
  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const token = await credential.getToken("https://analysis.windows.net/powerbi/api/.default");

    const embedRes = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ accessLevel: "View" })
    });

    const embedData = await embedRes.json();

    if (!embedData.token) {
      context.log("Embed token generation failed:", embedData);
      context.res = {
        status: 500,
        body: embedData
      };
      return;
    }

    context.res = {
      status: 200,
      body: { embedToken: embedData.token }
    };
  } catch (error) {
    context.log("Exception caught:", error);
    context.res = {
      status: 500,
      body: { error: "Server Error", details: error.message }
    };
  }
};
