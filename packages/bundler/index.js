#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Listr = require('listr');
const execa = require('execa');
const chalk = require('chalk');
const del = require('del');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2), {
    string: ['appMode'],
    boolean: ['lint', 'i18n'],
    default: {
        lint: true,
        fromCi: false,
        i18n: true,
        localize: false,
        appMode: 'bundle',
        remote: false,
        forceFetch: false,
        silentMessage: false
    }
});

// Compat mode WebClient
const ENV_FILE = fs.existsSync('.env') ? '.env' : 'env/.env';
require('dotenv').config({ path: ENV_FILE });

const { debug, success, error, about, warn } = require('./lib/helpers/log')('proton-bundler');
const coucou = require('./lib/helpers/coucou');
const { bash, script } = require('./lib/helpers/cli');
const {
    customBundler: { tasks: customTasks, config: customConfig },
    getCustomHooks
} = require('./lib/custom');
const { pull, push, getConfig, logCommits, generateChangelog } = require('./lib/git');
const buildRemote = require('./lib/buildRemote');

const PKG = require(path.join(process.cwd(), 'package.json'));

const getTasks = (branch, { isCI, flowType = 'single', forceI18n, appMode, runI18n, isRemoteBuild }) => {
    const { EXTERNAL_FILES = ['.htaccess'] } = customConfig;
    const { hookPreTasks, hookPostTasks, hookPostTaskClone, hookPostTaskBuild, customConfigSetup } = getCustomHooks(
        customTasks({
            branch,
            isCI,
            flowType,
            appMode,
            forceI18n,
            runI18n,
            isRemoteBuild
        })
    );

    const configTasks = customConfigSetup.length
        ? customConfigSetup
        : [
              {
                  title: 'Setup app config',
                  enabled: () => !isCI,
                  task() {
                      return bash('npx proton-pack', process.argv.slice(2));
                  }
              }
          ];

    const list = [
        ...hookPreTasks,
        {
            title: 'Save dependencies if we need',
            enabled: () => !isRemoteBuild && !isCI && /dev|beta|alpha/.test(branch),
            task() {
                return script('updatePackageLock.sh', [argv['default-branch']]);
            }
        },
        {
            title: 'Clear previous dist',
            async task() {
                await del(['dist', 'distCurrent', 'distback'], { dryRun: false });
                isCI && execa('mkdir dist');
            }
        },
        {
            title: 'Lint sources',
            enabled: () => argv.lint !== false && !isRemoteBuild,
            task: () => execa('npm', ['run', 'lint'])
        },
        ...configTasks,
        {
            title: 'Extract git env for the bundle',
            enabled: () => !isCI,
            async task(ctx) {
                const { commit, branch, tag } = await getConfig();
                ctx.originCommit = commit;
                ctx.originBranch = branch;
                ctx.tag = tag;
            }
        },
        {
            title: `Pull dist branch ${branch}`,
            enabled: () => !isCI,
            task: () => pull(branch, argv.forceFetch, argv.fromCi)
        },
        ...hookPostTaskClone,
        {
            title: 'Copy some files',
            task() {
                const rule = EXTERNAL_FILES.length > 1 ? `{${EXTERNAL_FILES.join(',')}}` : EXTERNAL_FILES.join(',');
                return bash(`cp src/${rule} dist/`);
            }
        },
        {
            title: 'Upgrade translations inside the app',
            enabled: () => forceI18n || (runI18n && !isCI && /prod|beta/.test(branch)),
            task() {
                return execa('npm', ['run', 'i18n:getlatest']);
            }
        },
        {
            title: 'Build the application',
            task() {
                const args = process.argv.slice(2);
                if (appMode === 'standalone') {
                    return execa('npm', ['run', 'build:standalone', '--', ...args]);
                }

                return execa('npm', ['run', 'build', '--', ...args]);
            }
        },
        ...hookPostTaskBuild,
        {
            title: `Push dist to ${branch}`,
            enabled: () => !isCI,
            task: (ctx) => push(branch, ctx)
        },
        {
            title: 'Update crowdin with latest translations',
            enabled: () => runI18n && !isCI && /prod|beta/.test(branch),
            task() {
                return execa('npm', ['run', 'i18n:upgrade']);
            }
        },
        ...hookPostTasks,
        {
            title: 'Inform us about new translations available',
            enabled: () => runI18n && !isCI && /prod|beta/.test(branch),
            task() {
                const [, type] = branch.match(/deploy-(\w+)/) || [];
                return execa('npx', ['proton-i18n', 'coucou', type]);
            }
        }
    ];
    return list;
};

/**
 * Get the API dest when we deploy.
 * You can use the custom config from proton.bundler.js to get it
 * @return {Promise<String>}
 */
async function getAPIUrl() {
    if (customConfig.apiUrl) {
        return customConfig.apiUrl;
    }

    const args = process.argv.slice(2);
    const { stdout } = await bash('npx proton-pack print-config', args);
    debug(stdout, 'print-config output');
    const [, url] = stdout.match(/apiUrl": "(.+)"(,*?)/);
    return url;
}

async function main() {
    /*
        If we build from the remote repository we need to:
            - clone the repository inside /tmp
            - install dependencies
            - run the deploy command again from this directory
        So let's put an end to the current deploy.
     */
    if (argv.remote) {
        await buildRemote(PKG);
        const args = process.argv.slice(2).filter((key) => !/--remote/.test(key));
        return script('builder.sh', [PKG.name, ...args], 'inherit'); // inherit for the colors ;)
    }

    // Custom local deploy for the CI
    const isCI = process.env.NODE_ENV_DIST === 'ci';
    const branch = argv.branch;
    const flowType = argv.flow;
    const runI18n = argv.i18n;
    const forceI18n = argv.localize;
    const appMode = argv.appMode;
    const isRemoteBuild = argv.source === 'remote';

    debug({ customConfig, argv }, 'configuration deploy');

    if (!branch && !isCI) {
        throw new Error('You must define a branch name. --branch=XXX');
    }

    const apiUrl = await getAPIUrl();

    process.env.NODE_ENV_BRANCH = branch;
    process.env.NODE_ENV_API = apiUrl;

    about({
        ...(!isCI && { branch }),
        apiUrl,
        appMode,
        isRemoteBuild,
        SENTRY: process.env.NODE_ENV_SENTRY
    });

    const start = moment(Date.now());
    const listTasks = getTasks(branch, { isCI, flowType, forceI18n, appMode, runI18n, isRemoteBuild });
    const tasks = new Listr(listTasks, {
        renderer: UpdaterRenderer,
        collapse: false
    });

    await tasks.run();

    const now = moment(Date.now());
    const total = now.diff(start, 'seconds');
    const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

    !isCI && success('App deployment done', { time });
    isCI && success(`Build CI app to the directory: ${chalk.bold('dist')}`, { time });

    if (!isCI && !argv.silentMessage) {
        return logCommits(branch, flowType).then((data) => {
            if (/deploy-(beta|prod|old|tor|dev)/.test(branch)) {
                const [, env] = branch.match(/deploy-(beta|prod|old|tor|dev)/);
                coucou.send(data, { env, flowType }, PKG);
            }
        });
    }
}

if (argv._.includes('hosts')) {
    return script('createNewDeployBranch.sh', process.argv.slice(3)).then(({ stdout }) => console.log(stdout));
}

if (argv._.includes('log-commits')) {
    const { branch, flow: flowType, custom } = argv;
    debug(argv, 'arguments');
    return logCommits(branch, flowType).then((data) => {
        if (/deploy-(beta|prod|old|tor|dev)/.test(branch)) {
            const [, env] = branch.match(/deploy-(beta|prod|old|tor|dev)/);
            coucou.send(data, { env, flowType, custom }, PKG);
        }
    });
}

if (argv._.includes('changelog')) {
    const { branch } = argv;
    const url = argv.url || (PKG.bugs || {}).url;
    debug({ argv }, 'arguments');

    if (!['dev', process.env.QA_BRANCH].includes(branch)) {
        return warn(`No changelog available for the branch ${branch}`); // not available
    }

    if (!url) {
        return warn('No URL found for the issues');
    }

    return generateChangelog(branch, url).then((data) => {
        if (data) {
            coucou.send(data, { env: branch, mode: 'changelog' }, PKG);
        }
    });
}

main().catch(error);
