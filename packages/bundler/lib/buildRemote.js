const fs = require('fs');
const path = require('path');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');

const { success } = require('./helpers/log')('proton-bundler');
const { script } = require('./helpers/cli');

async function main({ name }) {
    const list = [
        {
            title: `Clone remote ${name}`,
            async task() {
                await script('manageRemote.sh', ['clone', name]);
            },
        },
        {
            title: 'Install dependencies',
            async task() {
                await script('manageRemote.sh', ['install', name]);
            },
        },
        {
            title: 'Import appConfig.json',
            async task() {
                const input = path.join(process.cwd(), 'appConfig.json');
                const deprecatedInput = path.join(process.cwd(), 'env.json');
                const output = path.join('/tmp', name, 'appConfig.json');

                if (fs.existsSync(deprecatedInput)) {
                    return fs.createReadStream(deprecatedInput).pipe(fs.createWriteStream());
                }

                fs.createReadStream(input).pipe(fs.createWriteStream(output));
            },
        },
    ];

    const tasks = new Listr(list, {
        renderer: UpdaterRenderer,
        collapse: false,
    });

    await tasks.run();
    success('Clone and install success remote target');
}

module.exports = main;
