#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));

const CONFIG = require('./config');
const { error, debug } = require('./lib/helpers/log')('proton-i18n');
const renderHelp = require('./lib/helpers/help');
const coucou = require('./lib/helpers/coucou');

const is = (command) => argv._.includes(command);

async function main() {
    debug(CONFIG.getEnv(), 'ENV');

    if (is('crowdin')) {
        await require('./lib/crowdin')();
    }

    if (is('commit')) {
        await require('./lib/commit')(argv._[1]);
    }

    if (is('extract')) {
        await require('./lib/extract')(argv._[1]);
    }

    if (is('validate')) {
        require('./lib/validate')(argv._[1], { dir: argv._[2] });
    }

    if (is('compile')) {
        require('./lib/compile')();
    }

    if (is('list')) {
        require('./lib/cache').write(argv._[1]);
    }

    if (is('coucou')) {
        coucou.send('coucou', argv._[1]);
    }

    if (is('upgrade')) {
        const isWebsite = argv.website;
        // Add custom limit if we don't use custom
        require('./lib/upgrade')(
            [
                !argv.custom && {
                    title: 'Get list of translations available',
                    task: () =>
                        require('./lib/crowdin')({
                            type: true,
                            list: true,
                            limit: argv['limit-i18n'] || 90,
                            outputLang: true
                        })
                },
                {
                    title: 'Upgrade our translations with ones from crowdin',
                    task: () =>
                        require('./lib/crowdin')({
                            sync: true
                        })
                },
                {
                    title: 'Store a cache of translations available in the app',
                    enabled: !isWebsite,
                    task: () => require('./lib/cache').write()
                },
                {
                    title: 'Export translations as JSON',
                    enabled: !isWebsite,
                    task: () => require('./lib/compile')()
                },
                {
                    title: 'Commit translations',
                    task() {
                        const task = !isWebsite ? 'upgrade' : 'upgrade-website';
                        require('./lib/commit')(task);
                    }
                },
                {
                    title: 'ha que coucou',
                    task: () => coucou.send('upgrade')
                }
            ].filter(Boolean)
        );
    }

    if (is('help') && !is('crowdin')) {
        renderHelp();
    }
}

main().catch(error);
