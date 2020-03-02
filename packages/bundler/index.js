#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Listr = require('listr');
const chalk = require('chalk');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2), {
    string: ['appMode'],
    boolean: ['lint', 'git', 'only-git'],
    default: {
        website: false,
        git: false,
        lint: true,
        fromCi: false,
        appMode: 'bundle',
        remote: false,
        forceFetch: false,
        'only-git': false,
        silentMessage: false,
        'default-branch': 'master'
    }
});

// Compat mode WebClient
const ENV_FILE = fs.existsSync('.env') ? '.env' : 'env/.env';
require('dotenv').config({ path: ENV_FILE });

const { debug, success, error } = require('./lib/helpers/log')('proton-bundler');
const askDeploy = require('./lib/ask');
const { get: getConfig } = require('./lib/config');
const getTasks = require('./lib/tasks/index');
const remoteBuildProcesss = require('./lib/tasks/remote');
const changelogProcess = require('./lib/tasks/changelog');
const { script } = require('./lib/helpers/cli');

const PKG = require(path.join(process.cwd(), 'package.json'));

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
        return remoteBuildProcesss(PKG);
    }

    const config = await getConfig(argv);
    const start = moment(Date.now());
    const listTasks = getTasks({ config, PKG, argv });
    const tasks = new Listr(listTasks, {
        renderer: UpdaterRenderer,
        collapse: false
    });

    const { isDeployGit, isOnlyDeployGit, branch } = config;
    await tasks.run();

    const now = moment(Date.now());
    const total = now.diff(start, 'seconds');
    const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

    successMessage(time, config);

    if ((isDeployGit || isOnlyDeployGit) && !argv.silentMessage) {
        return askDeploy(branch, PKG, argv);
    }
}

if (argv._.includes('hosts')) {
    return script('createNewDeployBranch.sh', process.argv.slice(3)).then(({ stdout }) => console.log(stdout));
}

if (argv._.includes('log-commits')) {
    const parseEnv = ({ branch, website }) => {
        if (website && /deploy-(a|b)$/.test(branch)) {
            return 'deploy-prod';
        }
        return branch;
    };

    debug(argv, 'arguments');
    const branchName = parseEnv(argv);
    return askDeploy(branchName, PKG, argv);
}

if (argv._.includes('changelog')) {
    return changelogProcess(argv, PKG);
}

main().catch(error);
