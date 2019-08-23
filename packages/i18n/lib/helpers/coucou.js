const got = require('got');
const dedent = require('dedent');
const { error, success } = require('./log')('proton-i18n');

async function send(message = '') {
    try {
        await got.post(process.env.CROWDIN_MESSAGES_HOOK, {
            body: JSON.stringify({
                text: dedent`
                    :new: *new translations uploaded*: _${process.env.CROWDIN_FILE_NAME}_

                    ${message}
                `.trim()
            })
        });

        success('Message sent !');
    } catch (e) {
        error(e);
    }
}

module.exports = { send };
