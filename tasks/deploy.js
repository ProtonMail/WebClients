#!/usr/bin/env node

const os = require('os');
const path = require('path');
const Listr = require('listr');
const execa = require('execa');
const chalk = require('chalk');
const del = require('del');
const UpdaterRenderer = require('listr-update-renderer');
const moment = require('moment');

const { success, error, warn, json } = require('./helpers/log');
const env = require('../env/config');
const { CONFIG, branch } = env.getConfig('dist');
const { externalFiles } = require('../env/conf.build');

const bash = (cli) => execa.shell(cli, { shell: '/bin/bash' });
const push = async (branch) => {
    ``;
    const commands = ['cd dist'];

    const message = /-prod-/.test(branch) ? `New Release ${CONFIG.app_version}` : 'New Release';
    const description = `Based on the commit: ${CONFIG.sentry.release}`;

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

/**
 * Create sub bundles of the app as the diff won't exist or
 * is only about one key for A/B testing (prod-b)
 * @param  {String} branch
 * @param  {Boolean} options.start Create cache dist dir
 * @param  {Boolean} options.end   Remove cache dist dir
 * @return {Promise}
 */
const buildCustomApp = async (branch, { start, end } = {}) => {
    const { abSiteId } = CONFIG.statsConfig;
    const { abSiteId: abSiteIdB } = env.getStatsConfig(branch);
    const { CONFIG: cfg } = env.getConfig('dist');

    process.env.NODE_ENV_BRANCH = branch;
    process.env.NODE_ENV_API = cfg.apiUrl;

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
        // Because for the lulz. cf https://myshittycode.com/2014/07/24/os-x-sed-extra-characters-at-the-end-of-l-command-error/
        if (os.platform() === 'darwin') {
            await bash(
                `sed -i '' "s/abSiteId:${abSiteId}/abSiteId:${abSiteIdB}/g;" $(find distCurrent -type f -name 'app.*.js')`
            );
        } else {
            await bash(
                `sed -i "s/abSiteId:${abSiteId}/abSiteId:${abSiteIdB}/g;" $(find distCurrent -type f -name 'app.*.js')`
            );
        }
    }

    await bash('rm -rf distCurrent');

    if (end) {
        await bash(`rm -rf distback`);
    }

    await push(branch);
};

const checkEnv = async () => {
    try {
        await bash('[ -e ./env/env.json ]');
    } catch (e) {
        throw new Error('You must have env.json to deploy. Cf the wiki');
    }
};

const getTasks = (branch, { isCI, flowType = 'single' }) => {
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
            task() {
                return execa('tasks/setupConfig.js', process.argv.slice(2));
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
            title: 'Build the application',
            task() {
                const args = process.argv.slice(2);
                return execa('npm', ['run', 'dist', ...args]);
            }
        },
        {
            title: 'Generate the changelog',
            task() {
                const fileName = path.join('dist', CONFIG.changelogPath);
                return bash(`tasks/generateChangelog.js ./CHANGELOG.md ${fileName}`);
            }
        },
        {
            title: 'Generate the version info',
            task() {
                const fileName = path.join('dist', CONFIG.versionPath);
                return bash(`tasks/generateVersionInfo.js ${CONFIG.app_version} ${CONFIG.commit} ${fileName}`);
            }
        },
        {
            title: `Push dist to ${branch}`,
            enabled: () => !isCI,
            task: () => push(branch)
        },
        {
            title: 'Create I18N',
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
            task() {
                return buildCustomApp(`deploy-${key}`, {
                    start: i === 0,
                    end: i === arr.length - 1
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
process.env.NODE_ENV_API = CONFIG.apiUrl;

!isCI && console.log(`➙ Branch: ${chalk.bgYellow(chalk.black(branch))}`);
console.log(`➙ API: ${chalk.bgYellow(chalk.black(CONFIG.apiUrl))}`);
console.log(`➙ SENTRY: ${chalk.bgYellow(chalk.black(process.env.NODE_ENV_SENTRY))}`);
console.log('');

env.argv.debug && json(CONFIG);

const flowType = env.argv.flow;
const start = moment(Date.now());
const tasks = new Listr(getTasks(branch, { isCI, flowType }), {
    renderer: UpdaterRenderer,
    collapse: false
});

tasks
    .run()
    .then(() => {
        const now = moment(Date.now());
        const total = now.diff(start, 'seconds');
        const time = total > 60 ? moment.utc(total * 1000).format('mm:ss') : `${total}s`;

        !isCI && success('App deployment done', { time });
        isCI && success(`Build CI app to the directory: ${chalk.bold('dist')}`, { time });
    })
    .catch(error);
