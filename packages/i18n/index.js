#!/usr/bin/env node

const { error } = require('./lib/helpers/log')('proton-i18n');
const renderHelp = require('./lib/helpers/help');

const argv = process.argv.slice(2);
const is = (command) => argv.includes(command);

async function main() {
    const [, ...options] = argv;

    if (is('extract')) {
        await require('./lib/extract')(options[0]);
    }

    if (is('validate')) {
        await require('./lib/validate')(options[0], { dir: options[1] });
    }

    if (is('help')) {
        renderHelp();
    }
    process.exit(0);
}

main().catch(error);
