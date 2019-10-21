const path = require('path');
const got = require('got');
const dedent = require('dedent');
const { error, success, warn } = require('./log')('proton-i18n');

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
        await got.post(process.env.CROWDIN_MESSAGES_HOOK, {
            body: JSON.stringify({
                text: dedent`
                    ${header}

                    ${type !== 'coucou' ? message : ''}
                `.trim()
            })
        });

        success('Message sent !');
    } catch (e) {
        error(e);
    }
}

module.exports = { send };
