module.exports = async function (context, req) {
    context.res = {
        body: {
            embedToken: "mocked-token-for-testing"
        }
    };
};