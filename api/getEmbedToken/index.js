// File: api/getEmbedToken/index.js

const msal = require('@azure/msal-node');
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    const tenantId = "9ec0ad59-4d4d-4463-8568-693ee403cbbc";
    const clientId = "89911bc4-d16c-4b3e-97b0-503075f664fa";
    const clientSecret = "223365d2-7b1f-4f80-a890-c57ecda21f01";
    const workspaceId = "baf25c7c-9f99-4275-bc53-78e667484c07";
    const reportId = "4670b8dd-3249-478b-8554-1252db429d0d";

    const authority = `https://login.microsoftonline.com/${tenantId}`;
    const scope = ["https://analysis.windows.net/powerbi/api/.default"];

    const cca = new msal.ConfidentialClientApplication({
        auth: { clientId, authority, clientSecret }
    });

    try {
        // Get Azure AD token
        const result = await cca.acquireTokenByClientCredential({ scopes: scope });

        const embedTokenResponse = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${result.accessToken}`
            },
            body: JSON.stringify({
                accessLevel: "view"
            })
        });

        const embedTokenData = await embedTokenResponse.json();

        context.res = {
            status: 200,
            body: {
                embedToken: embedTokenData.token,
                embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
                reportId: reportId
            }
        };
    } catch (err) {
        context.log.error("Token fetch failed", err);
        context.res = {
            status: 500,
            body: { error: "Failed to fetch embed token." }
        };
    }
};
