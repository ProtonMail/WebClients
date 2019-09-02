const https = require('https');
const dedent = require('dedent');
const { error, success } = require('./log')('proton-bundler');

async function send(data) {
    try {
        const body = JSON.stringify({
            text: dedent`
                ${process.env.DEPLOY_MESSAGE} ${process.env.DEPLOY_MESSAGE_URL} ?

                ${data}
            `.trim()
        });

        const { pathname, host } = new URL(process.env.DEPLOY_MESSAGES_HOOK);

        const req = https.request(
            {
                host,
                port: 443,
                path: pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body, 'utf8')
                }
            },
            (res) => {
                if (res.statusCode === 200) {
                    success('Message sent !');
                }
            }
        );

        req.on('error', (e) => {
            console.error(e);
            throw e;
        });
        req.write(body);
        req.end();
    } catch (e) {
        error(e);
    }
}

module.exports = { send };
