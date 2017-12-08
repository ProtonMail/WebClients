#!/usr/bin/env node

const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execRaw = require('child_process').exec;
const chalk = require('chalk');

const { CONFIG, branch } = require('../env/config').getConfig('dist');
const success = (msg) => console.log(`${chalk.green('✓')} ${msg}.`);

const commandeVerbose = (command) => {
    return new Promise((resolve, reject) => {
        const callback = (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        };

        const build = execRaw(
            command,
            {
                maxBuffer: 1000 * 1000 * 10 // 10 MB
            },
            callback
        );
        build.stdout.pipe(process.stdout);
        build.stderr.pipe(process.stderr);
    });
};

const setupConfig = async () => {
    const args = process.argv.slice(2).join(' ');
    await commandeVerbose(`tasks/setupConfig.js ${args}`);
    success('Generate configuration');
};

const pullDist = async (branch) => {
    const commands = [`git fetch origin ${branch}:${branch}`];
    commands.push(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    commands.push('cd dist');
    commands.push('rm -rf *');
    await exec(commands.join(' && '));
    success('Pull dist');
};

const push = async (branch) => {
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
    await exec(commands.join(' && '));
    success('Push new release');
};

const i18n = async (branch) => {
    if (!/prod|beta/.test(branch)) {
        console.log('⚠ We only build i18n for prod || beta');
        return Promise.resolve();
    }
    await exec('npm run i18n:build');
    success('Build I18N ');
};

const buildApp = async () => {
    await commandeVerbose('npm run dist');
    success('Build application');
};

(async () => {
    try {
        console.log('~', chalk.bgYellow(chalk.black(`Deploy with API: ${CONFIG.apiUrl}`)), '~');

        if (!branch) {
            throw new Error('You must define a branch name. --branch=XXX');
        }

        await setupConfig();
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
