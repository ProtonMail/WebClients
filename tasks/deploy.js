#!/usr/bin/env node

const os = require('os');
const path = require('path');
const Listr = require('listr');
const execa = require('execa');
const chalk = require('chalk');
const del = require('del');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');

const { success, error, warn, json, title } = require('./helpers/log');
const env = require('../env/config');
const { apiUrl, branch, statsConfig, sentry } = env.getEnvDeploy({
    env: 'dist',
    config: false
});
const { externalFiles } = require('../env/conf.build');

const bash = (cli) => execa.shell(cli, { shell: '/bin/bash' });
const push = async (branch, { config, originBranch }) => {
    const commands = ['cd dist'];

    const message = /-prod-/.test(branch) ? `New Release ${config.app_version}` : 'New Release';
    const description = `Based on the commit: ${config.sentry.release} on the branch ${originBranch}`;

    if (os.platform() === 'linux') {
        commands.push('git ls-files --deleted -z | xargs -r -0 git rm');
    } else {
        commands.push('(git ls-files --deleted -z  || echo:) | xargs -0 git rm');
    }
    commands.push('git add --all');
    commands.push(`git commit -m "${message}" -m '${description}'`);
    commands.push(`git push origin ${branch}`);
    commands.push('cd ..');
    commands.push(`git push origin ${branch}`);
    return bash(commands.join(' && '));
};

const pullDist = async (branch, force) => {
    const flag = force ? '-f' : '';
    await bash(`git fetch ${flag} origin ${branch}:${branch}`);
    await bash(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    await bash('cd dist  && rm -rf *');
};

function sed(rule, files) {
    // Because for the lulz. cf https://myshittycode.com/2014/07/24/os-x-sed-extra-characters-at-the-end-of-l-command-error/
    if (os.platform() === 'darwin') {
        return bash(`sed -i '' "${rule}" $(${files})`);
    }
    return bash(`sed -i "${rule}" $(${files})`);
}

async function replace(rule) {
    const files = "find dist -type f -name '*.chunk.js' ! -name 'vendor*' ! -name 'app*'";
    await sed(rule, files);
}

/**
 * Sync new SRI config:
 *     - Generate hash for files with the modifications
 *     - Replace them inside index.js
 *     - Then we replace the SRI of index.js inside index.htmll
 * @return {Promise}
 */
async function replaceSRI() {
    const { stdout: stdoutNew } = await bash('./tasks/manageSRI get-new');
    const { stdout: stdoutProd } = await bash('./tasks/manageSRI get-prod');

    // Create {<file>:hash}
    const toList = (input = '') => {
        return input.split('\n').reduce((acc, value, i, list) => {
            if (i % 2 === 0) {
                acc[value] = '';
            }
            if (i % 2 === 1) {
                acc[list[i - 1]] = value;
            }
            return acc;
        }, {});
    };

    const HASHES_PROD = toList(stdoutProd);
    const HASHES_NEW = toList(stdoutNew);

    // Create sed string for the replace
    const arg = Object.keys(HASHES_PROD)
        .reduce((acc, key) => {
            const file = key.replace('distCurrent', 'dist');
            const oldHash = HASHES_PROD[key];
            const newHash = HASHES_NEW[file];
            if (oldHash !== newHash) {
                acc.push(`s|${oldHash}|${newHash}|g;`);
            }
            return acc;
        }, [])
        .join('');

    // Bind new hashes
    await bash(`./tasks/manageSRI write-index "${arg}"`);
    // Bind new hash for index.js
    await bash('./tasks/manageSRI write-html');
}

/**
 * Check if the sub-build is valid
 *     - Correct SRI for updated files
 *     - Correct SRI for the index
 *     - Right config for A/B
 *     - Right config for Sentry
 * Stop the process if it fails
 */
async function validateBuild(branch) {
    return bash(`./tasks/manageSRI validate ${branch.replace('deploy-', '')}`);
}

/**
 * Create sub bundles of the app as the diff won't exist or
 * is only about one key for A/B testing (prod-b)
 * @param  {String} branch
 * @param  {Boolean} options.start Create cache dist dir
 * @param  {Boolean} options.end   Remove cache dist dir
 * @return {Promise}
 */
const buildCustomApp = async (branch, { start, end, originBranch, deployBranch } = {}) => {
    const { abSiteId } = statsConfig;
    const { abSiteId: abSiteIdB } = env.getStatsConfig(branch);
    const config = env.getConfig('dist', branch);
    const { sentry: sentryB } = config;

    process.env.NODE_ENV_BRANCH = branch;
    process.env.NODE_ENV_API = config.apiUrl;

    if (start) {
        // Backup build to prevent conditions as it will always be the same things to replace
        await bash('rsync -av --progress dist/ distback --exclude .git');
    }

    // Backup build assets
    const cli = ['rsync -av --progress distback/ distCurrent --exclude .git', 'rm -rf dist'];
    await bash(cli.join(' && '));
    await pullDist(branch, true);

    // Update previous dist with new assets
    await bash('rsync -av --delete distCurrent/ dist --exclude .git');

    // A/B testing config
    if (/deploy-prod/.test(branch)) {
        await replace(`s/abSiteId:${abSiteId}/abSiteId:${abSiteIdB}/g;`);
    }

    // Replace the correct sentry URL
    await replace(`s|${sentry.sentry}|${sentryB.sentry}|g;`);
    await replaceSRI();
    await validateBuild(branch);

    await bash('rm -rf distCurrent');

    if (end) {
        await bash(`rm -rf distback`);
    }

    await push(branch, { config, originBranch });
};

const checkEnv = async () => {
    try {
        await bash('[ -e ./env/env.json ]');
    } catch (e) {
        throw new Error('You must have env.json to deploy. Cf the wiki');
    }
};

const getTasks = (branch, { isCI, flowType = 'single', forceI18n }) => {
    const list = [
        {
            title: 'Check env',
            task: () => checkEnv()
        },
        {
            title: 'Check dependencies',
            task: () => execa('./tasks/checkDependencies.js')
        },
        {
            title: 'Save dependencies if we need',
            enabled: () => !isCI && /dev|beta|alpha/.test(branch),
            task() {
                return execa('./tasks/updatePackageLock.sh');
            }
        },
        {
            title: 'Clear previous dist',
            task: async () => {
                await del(['dist', 'distCurrent', 'distback'], { dryRun: false });
                isCI && execa.shell('mkdir dist');
            }
        },
        {
            title: 'Lint sources',
            task: () => execa('npm', ['run', 'lint'])
        },
        {
            title: 'Setup config',
            enabled: () => !isCI,
            async task(ctx) {
                await execa('tasks/setupConfig.js', process.argv.slice(2));
                const { stdout } = await bash('git rev-parse --abbrev-ref HEAD');
                ctx.config = env.getConfig('dist');
                ctx.originBranch = stdout;
            }
        },
        {
            title: `Pull dist branch ${branch}`,
            enabled: () => !isCI,
            task: () => pullDist(branch)
        },
        {
            title: 'Copy some files',
            task() {
                return bash(`cp src/{${externalFiles.list.join(',')}} dist/`);
            }
        },
        {
            title: 'Upgrade translations',
            enabled: () => forceI18n || (!isCI && /prod|beta/.test(branch)),
            task() {
                return execa('npm', ['run', 'i18n:sync']);
            }
        },
        {
            title: 'Build the application',
            task() {
                const args = process.argv.slice(2);
                return execa('npm', ['run', 'dist', ...args]);
            }
        },
        {
            title: 'Generate the changelog',
            task(ctx) {
                const { changelogPath } = ctx.config;
                const fileName = path.join('dist', changelogPath);
                return bash(`tasks/generateChangelog.js ./CHANGELOG.md ${fileName}`);
            }
        },
        {
            title: 'Generate the version info',
            task(ctx) {
                const { versionPath, app_version, commit } = ctx.config;
                const fileName = path.join('dist', versionPath);
                return bash(`tasks/createVersionJSON.sh ${commit} ${app_version} ${fileName}`);
            }
        },
        {
            title: `Push dist to ${branch}`,
            enabled: () => !isCI,
            task: (ctx) => push(branch, ctx)
        },
        {
            title: 'Update crowdin with latest translations',
            enabled: () => !isCI && /prod|beta/.test(branch),
            task() {
                return execa('npm', ['run', 'i18n:build']);
            }
        }
    ];

    if (isCI || flowType !== 'many') {
        return list;
    }

    // Keep prod-b as the latest one as it's the only one with a diff config
    ['dev', 'tor', 'beta', 'prod-b'].forEach((key, i, arr) => {
        list.push({
            title: `Create sub-bundle for deploy-${key}`,
            enabled: () => !isCI && /prod-a$/.test(branch),
            task(ctx) {
                return buildCustomApp(`deploy-${key}`, {
                    start: i === 0,
                    end: i === arr.length - 1,
                    deployBranch: branch,
                    originBranch: ctx.originBranch
                });
            }
        });
    });
    return list;
};

// Custom local deploy for the CI
const isCI = process.env.NODE_ENV_DIST === 'ci';

if (!branch && !isCI) {
    throw new Error('You must define a branch name. --branch=XXX');
}

if (/cobalt/.test(branch) && !env.argv.qaforce) {
    warn('QA Branch do not update cf wiki server dev');
    console.log('To force update use the flag --qaforce');
    process.exit(0);
}

process.env.NODE_ENV_BRANCH = branch;
process.env.NODE_ENV_API = apiUrl;

!isCI && console.log(`➙ Branch: ${chalk.bgYellow(chalk.black(branch))}`);
console.log(`➙ API: ${chalk.bgYellow(chalk.black(apiUrl))}`);
console.log(`➙ SENTRY: ${chalk.bgYellow(chalk.black(process.env.NODE_ENV_SENTRY))}`);
console.log('');

const flowType = env.argv.flow;
const forceI18n = env.argv.i18n;
const start = moment(Date.now());
const tasks = new Listr(getTasks(branch, { isCI, flowType, forceI18n }), {
    renderer: UpdaterRenderer,
    collapse: false
});

tasks
    .run()
    .then((ctx) => {
        env.argv.debug && json(ctx);

        const now = moment(Date.now());
        const total = now.diff(start, 'seconds');
        const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

        !isCI && success('App deployment done', { time });
        isCI && success(`Build CI app to the directory: ${chalk.bold('dist')}`, { time });

        if (!isCI) {
            const [, target] = branch.match(/-(prod|beta|dev|old|tor)/) || [];

            if (!target) {
                return;
            }

            console.log('');
            title('Hash commits');
            const arg = flowType === 'many' ? '' : target;
            return bash(`./tasks/logcommits.sh ${arg}`.trim()).then(({ stdout }) => console.log(stdout));
        }
    })
    .catch(error);
