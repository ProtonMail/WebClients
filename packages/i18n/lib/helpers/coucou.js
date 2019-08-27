const got = require('got');
const dedent = require('dedent');
const { error, success } = require('./log')('proton-i18n');

async function send(type, message = '') {
    const map = {
        coucou: `:rocket: *translations available for the env*: _${message}_`,
        update: `:new: *new translations uploaded*: _${process.env.CROWDIN_FILE_NAME}_`,
        upgrade: `:information_source: *new version of translations added inside the app* (_inside the source, github_)`
    };

    try {
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
