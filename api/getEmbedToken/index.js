const axios = require('axios');
const qs = require('qs');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const REPORT_ID = process.env.REPORT_ID;

module.exports = async function (context, req) {
  try {
    const {
      TENANT_ID,
      CLIENT_ID,
      CLIENT_SECRET,
      WORKSPACE_ID,
      REPORT_ID
    } = process.env;

    // 1. Acquire Azure AD token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      qs.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://analysis.windows.net/powerbi/api/.default'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const aadToken = tokenResponse.data.access_token;

    // 2. Call embed token generation endpoint
    const embedResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${WORKSPACE_ID}/reports/${REPORT_ID}/GenerateToken`,
      {
        accessLevel: 'View'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aadToken}`
        }
      }
    );

    // 3. Construct response
    const embedToken = embedResponse.data.token;
    const reportId = REPORT_ID;
    const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${REPORT_ID}&groupId=${WORKSPACE_ID}`;

    context.res = {
      status: 200,
      body: {
        embedToken,
        embedUrl,
        reportId
      }
    };
  } catch (err) {
    context.log.error('❌ Failed to get embed token', err);
    context.res = {
      status: 500,
      body: `Failed to get embed token: ${err.message}`
    };
  }
};
