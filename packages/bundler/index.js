#!/usr/bin/env node

const Listr = require('listr');
const execa = require('execa');
const chalk = require('chalk');
const del = require('del');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));

const { debug, success, error, about } = require('./lib/helpers/log')('proton-bundler');
const { bash, script } = require('./lib/helpers/cli');

const {
    customBundler: { tasks: customTasks, config: customConfig },
    getCustomHooks
} = require('./lib/custom');
const { pull, push, getConfig, logCommits } = require('./lib/git');

const getTasks = (branch, { isCI, flowType = 'single', forceI18n, appMode }) => {
    const { EXTERNAL_FILES = ['.htaccess'] } = customConfig;
    const { hookPreTasks, hookPostTasks, hookPostTaskClone, hookPostTaskBuild, customConfigSetup } = getCustomHooks(
        customTasks({
            branch,
            isCI,
            flowType,
            appMode,
            forceI18n
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
            enabled: () => !isCI && /dev|beta|alpha/.test(branch),
            task() {
                return script('updatePackageLock.sh', [argv['default-branch']]);
            }
        },
        {
            title: 'Clear previous dist',
            async task() {
                await del(['dist', 'distCurrent', 'distback'], { dryRun: false });
                isCI && execa.shell('mkdir dist');
            }
        },
        {
            title: 'Lint sources',
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
            task: () => pull(branch)
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
            enabled: () => forceI18n || (!isCI && /prod|beta/.test(branch)),
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
            enabled: () => !isCI && /prod|beta/.test(branch),
            task() {
                return execa('npm', ['run', 'i18n:upgrade']);
            }
        },
        ...hookPostTasks
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
    debug(stdout);
    const [, url] = stdout.match(/apiUrl": "(.+)",/);
    return url;
}

async function main() {
    // Custom local deploy for the CI
    const isCI = process.env.NODE_ENV_DIST === 'ci';
    const branch = argv.branch;
    const flowType = argv.flow;
    const forceI18n = argv.i18n || false;
    const appMode = argv.appMode || 'bundle';

    debug({ customConfig, argv });

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
        SENTRY: process.env.NODE_ENV_SENTRY
    });

    const start = moment(Date.now());
    const listTasks = getTasks(branch, { isCI, flowType, forceI18n, appMode });
    const tasks = new Listr(listTasks, {
        renderer: UpdaterRenderer,
        collapse: false
    });

    const { context } = await tasks.run();
    debug(context);

    const now = moment(Date.now());
    const total = now.diff(start, 'seconds');
    const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

    !isCI && success('App deployment done', { time });
    isCI && success(`Build CI app to the directory: ${chalk.bold('dist')}`, { time });

    if (!isCI) {
        return logCommits(branch, flowType);
    }
}

if (argv._.includes('hosts')) {
    return script('createNewDeployBranch.sh', process.argv.slice(3)).then(({ stdout }) => console.log(stdout));
}

main().catch(error);
