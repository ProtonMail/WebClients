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
            }
        },
        {
            title: `Install dependencies`,
            async task() {
                await script('manageRemote.sh', ['install', name]);
            }
        }
    ];

    const tasks = new Listr(list, {
        renderer: UpdaterRenderer,
        collapse: false
    });

    await tasks.run();
    success('Clone and install success remote target');
}

module.exports = main;
