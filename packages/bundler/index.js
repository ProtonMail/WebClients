#!/usr/bin/env node

const fs = require('fs');
const Listr = require('listr');
const chalk = require('chalk');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2), {
    string: ['appMode'],
    boolean: ['lint', 'git', 'only-git'],
    default: {
        git: false,
        lint: true,
        fromCi: false,
        appMode: 'bundle',
        remote: false,
        forceFetch: false,
        'only-git': false,
        'default-branch': 'master'
    }
});

// Compat mode WebClient
const ENV_FILE = fs.existsSync('.env') ? '.env' : 'env/.env';
require('dotenv').config({ path: ENV_FILE });

const { success, error } = require('./lib/helpers/log')('proton-bundler');
const { get: getConfig } = require('./lib/config');
const getTasks = require('./lib/tasks/index');
const remoteBuildProcesss = require('./lib/tasks/remote');
const changelogProcess = require('./lib/tasks/changelog');
const flavorProcess = require('./lib/tasks/flavor');
const { script } = require('./lib/helpers/cli');

const successMessage = (time, { isOnlyDeployGit, isDeployGit }) => {
    if (isOnlyDeployGit || isDeployGit) {
        return success(`App deployment done -> ${chalk.bold('dist')}`, { time, space: true });
    }
    return success(`Bundle done, available -> ${chalk.bold('dist')}`, { time, space: true });
};

async function main() {
    /*
        If we build from the remote repository we need to:
            - clone the repository inside /tmp
            - install dependencies
            - run the deploy command again from this directory
        So let's put an end to the current deploy.
     */
    if (argv.remote) {
        return remoteBuildProcesss();
    }

    const config = await getConfig(argv);
    const start = moment(Date.now());
    const listTasks = getTasks({ config, argv });
    const tasks = new Listr(listTasks, {
        renderer: UpdaterRenderer,
        collapse: false
    });

    await tasks.run();

    const now = moment(Date.now());
    const total = now.diff(start, 'seconds');
    const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

    successMessage(time, config);
}

/*
    To catch unhandledPromiseRejection
 */
(async () => {
    if (argv._.includes('hosts')) {
        return script('createNewDeployBranch.sh', process.argv.slice(3)).then(({ stdout }) => console.log(stdout));
    }

    if (argv._.includes('flavor')) {
        return flavorProcess(argv);
    }

    if (argv._.includes('changelog')) {
        return changelogProcess(argv);
    }

    main().catch(error);
})().catch(error);
