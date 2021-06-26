const dedent = require('dedent');
const { error, success, debug, warn } = require('./log')('proton-bundler');
const { bash } = require('./cli');

async function send(data, { env, mode = 'deploy', api }) {
    const requests = {
        changelog() {
            if (!process.env.CHANGELOG_QA_HOOK) {
                return { warning: 'No changelog hook available' };
            }

            const scope = env === 'dev' ? `_available in a few minutes on ${env}_` : `_available on ${env}_`;
            const apiRow = api ? `API: *${api}*` : '';
            const text = dedent`
                ${scope}
                ${apiRow}

                ${data}
            `.trim();
            return { text, url: process.env.CHANGELOG_QA_HOOK };
        }
    };

    try {
        const { warning, url, text } = requests[mode]();

        if (warning) {
            return warn(warning);
        }

        debug(text, 'body message');

        const body = JSON.stringify({
            mrkdwn: true,
            text
        });

        // Escape the body.
        await bash(
            `curl -X POST -H 'Content-type: application/json' --data "${body
                .replace(/"/g, '\\"')
                .replace(/`/g, '\\`')}" ${url}`
        );
        success('Message sent !');
    } catch (e) {
        error(e);
    }
}

module.exports = { send };
