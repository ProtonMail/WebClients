const https = require('https');
const dedent = require('dedent');
const { error, success, debug } = require('./log')('proton-bundler');

const URLS = {
    'protonmail-web': {
        prod: 'mail',
        tor: 'https://protonirockerxow.onion/'
    },
    'proton-vpn-settings': {
        prod: 'account'
    }
};

const getURL = (name, env) => {
    const { [env]: scope = env } = URLS[name] || {};

    if (env === 'tor') {
        return scope;
    }
    return `${scope}.${process.env.DEPLOY_MESSAGE_URL}`;
};

async function send(data, env, { name } = {}) {
    try {
        const text = dedent`
            ${process.env.DEPLOY_MESSAGE} *${name}*?

            ENV: _${env}_
            URL: ${getURL(name, env)}

            Informations:
            ${data}
        `.trim();
        const body = JSON.stringify({
            mrkdwn: true,
            text
        });

        debug(text, 'body message');

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
                debug(res.statusCode);

                res.on('data', (d) => {
                    process.stdout.write(d);
                });

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
