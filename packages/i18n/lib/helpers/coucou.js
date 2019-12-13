const path = require('path');
const dedent = require('dedent');
const { error, success, warn } = require('./log')('proton-i18n');
const { bash } = require('./cli');

async function send(type, message = '') {
    try {
        if (!process.env.CROWDIN_MESSAGES_HOOK) {
            return warn('No deploy hook available');
        }

        const { name } = require(path.resolve(process.cwd(), 'package.json'));
        const map = {
            coucou: `:rocket: *translations available for the env*: _${message}_`,
            create: `:new: new translations added for *${name}*: _${process.env.CROWDIN_FILE_NAME}_`,
            update: `:new: *new translations uploaded*: _${process.env.CROWDIN_FILE_NAME}_`,
            upgrade: `:information_source: *${name}* new version of translations added inside the app (_inside the source, github_)`
        };

        const header = map[type];
        const body = JSON.stringify({
            mrkdwn: true,
            text: dedent`
                ${header}

                ${type !== 'coucou' ? message : ''}
            `.trim()
        });

        // Escape the body.
        await bash(
            `curl -X POST -H 'Content-type: application/json' --data "${body
                .replace(/"/g, '\\"')
                .replace(/`/g, '\\`')}" ${process.env.CROWDIN_MESSAGES_HOOK}`
        );

        success('Message sent !');
    } catch (e) {
        error(e);
    }
}

module.exports = { send };
