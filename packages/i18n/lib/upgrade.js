const { success } = require('./helpers/log')('proton-i18n');

async function main(commands) {
    for (const { task, enabled = true } of commands) {
        if (enabled) {
            await task();
        }
    }
    success('Latest translations available !');
}

module.exports = main;
