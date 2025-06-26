
const msal = require('@azure/msal-node');
const axios = require('axios');

module.exports = async function (context, req) {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID;
    const reportId = process.env.REPORT_ID;
    const workspaceId = process.env.WORKSPACE_ID;

    const authorityHostUrl = "https://login.microsoftonline.com";
    const authorityUrl = `${authorityHostUrl}/${tenantId}`;
    const scope = "https://analysis.windows.net/powerbi/api/.default";

    const config = {
        auth: {
            clientId: clientId,
            authority: authorityUrl,
            clientSecret: clientSecret,
        }
    };

    const cca = new msal.ConfidentialClientApplication(config);

    try {
        const result = await cca.acquireTokenByClientCredential({ scopes: [scope] });

        const accessToken = result.accessToken;
        const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}&autoAuth=true&ctid=${tenantId}`;

        context.res = {
            status: 200,
            body: {
                accessToken,
                reportId,
                workspaceId,
                tenantId,
                embedUrl,
                tokenResponse: result
            }
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: {
                error: err.message,
                stack: err.stack
            }
        };
    }
};
