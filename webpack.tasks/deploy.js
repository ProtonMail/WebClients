#!/usr/bin/env node

const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execRaw = require('child_process').exec;
const chalk = require('chalk');

const { CONFIG, branch } = require('../env/config').getConfig('dist');
const success = (msg) => console.log(`${chalk.green('✓')} ${msg}.`);

const pullDist = (branch) => {
    const commands = [`git fetch origin ${branch}:${branch}`];
    commands.push(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    commands.push('cd dist');
    commands.push('rm -rf *');
    return exec(commands.join(' && ')).then(() => success('Pull dist'));
};

const push = (branch) => {
    const commands = ['cd dist'];
    if (os.platform() === 'linux') {
        commands.push('git ls-files --deleted -z | xargs -r -0 git rm');
    } else {
        commands.push('(git ls-files --deleted -z  || echo:) | xargs -0 git rm');
    }
    commands.push('git add --all');
    commands.push('git commit -m "New Release"');
    commands.push(`git push origin ${branch}`);
    commands.push('cd ..');
    commands.push(`git push origin ${branch}`);
    return exec(commands.join(' && ')).then(() => success('Push new release'));
};

const i18n = (branch) => {
    if (!/prod|beta/.test(branch)) {
        console.log('We only build i18n !prod || beta');
        return Promise.resolve();
    }
    return exec('npm run i18n:build').then(() => success('Build I18N '));
};

const buildApp = () => {
    return new Promise((resolve, reject) => {
        const callback = (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        };

        const build = execRaw(
            'npm run dist',
            {
                maxBuffer: 1000 * 1000 * 10 // 10 MB
            },
            callback
        );
        build.stdout.pipe(process.stdout);
        build.stderr.pipe(process.stderr);
    }).then(() => success('Build application'));
};

(async () => {
    try {
        console.log('~', chalk.bgYellow(chalk.black(`Deploy with API: ${CONFIG.apiUrl}`)), '~');

        if (!branch) {
            throw new Error('You must define a branch name. --branch=XXX');
        }

        await pullDist(branch);
        await buildApp();
        await push(branch);
        await i18n(branch);
        success(`App deployment to ${branch} done`);
        process.exit(0);
    } catch (e) {
        console.log(chalk.magentaBright(' ⚠ '), chalk.red(e.message));
        process.exit(1);
    }
})();
