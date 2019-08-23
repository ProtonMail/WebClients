const { success } = require('./helpers/log')('proton-i18n');

async function main(commands) {
    for (const { task } of commands) {
        await task();
    }
    success('Latest translations available !');
}

module.exports = main;
