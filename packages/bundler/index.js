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
        website: false,
        lint: true,
        fromCi: false,
        i18n: true,
        localize: false,
        appMode: 'bundle',
        remote: false,
        forceFetch: false,
        silentMessage: false,
        'default-branch': 'master'
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
const { pull, push, getConfig, generateChangelog } = require('./lib/git');
const askDeploy = require('./lib/ask');
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
        {
            title: 'Check if the deploy branch exists',
            skip() {
                if (!(process.env.QA_BRANCHES || '').length) {
                    return 'If you do not have QA_BRANCHES inside your .env you cannot deploy to something new';
                }

                if (`deploy-${process.env.QA_BRANCH}` === branch) {
                    return '🤖 No need to check for this branch, it exists';
                }

                const branches = process.env.QA_BRANCHES.split(',').join('|');
                // Do not try to deploy on QA or cobalt
                if (new RegExp(`deploy-(cobalt|${branches})`).test(branch)) {
                    return '✋ You shall not deploy to QA';
                }
            },
            enabled: () => !/dev|beta|prod|tor|old/.test(branch),
            async task() {
                // For the CI to force SSH
                if (process.env.GIT_REMOTE_URL_CI && argv.fromCi) {
                    await bash(`git remote set-url origin ${process.env.GIT_REMOTE_URL_CI}`);
                }
                return script('createNewDeployBranch.sh', ['--check', branch.replace('deploy-', '')], 'inherit');
            }
        },
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
                debug(ctx, 'git env bundle');
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
            title: 'Generate the version info',
            task(ctx) {
                const { tag = `v${PKG.version}`, originCommit } = ctx || {};
                const fileName = path.join('dist', 'assets/version.json');
                return script('createVersionJSON.sh', [originCommit, tag, fileName]);
            }
        },
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
    const { branch, mode, api } = argv;
    const url = argv.url || (PKG.bugs || {}).url;
    const isV4 = mode === 'v4';
    debug({ argv }, 'arguments');

    if (!['dev', 'v4', process.env.QA_BRANCH].includes(branch) && !isV4) {
        return warn(`No changelog available for the branch ${branch}`); // not available
    }

    if (!url && !isV4) {
        return warn('No URL found for the issues');
    }

    return generateChangelog(branch, url, isV4).then((data) => {
        const env = isV4 ? 'https://v4.protonmail.blue' : branch;
        if (data) {
            coucou.send(data, { env, mode: 'changelog', api }, PKG);
        }
    });
}

main().catch(error);
