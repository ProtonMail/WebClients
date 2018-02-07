#!/usr/bin/env node

const os = require('os');
const { exec, execVerbose } = require('./helpers/command');
const { title, success, error } = require('./helpers/log');

const { CONFIG, branch } = require('../env/config').getConfig('dist');

const setupConfig = async () => {
    const args = process.argv.slice(2).join(' ');
    await execVerbose(`tasks/setupConfig.js ${args}`);
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
    success('Build I18N');
};

const buildApp = async () => {
    const args = process.argv.slice(2).join(' ');
    await execVerbose(`npm run dist ${args}`);
    success('Build application');
};

const lint = async () => {
    await execVerbose('npm run lint');
    success('Lint application');
};

(async () => {
    try {
        title(`Deploy with API: ${CONFIG.apiUrl}`);

        if (!branch) {
            throw new Error('You must define a branch name. --branch=XXX');
        }

        process.env.NODE_ENV_BRANCH = branch;
        process.env.NODE_ENV_API = CONFIG.apiUrl;

        await lint();
        await setupConfig();
        await pullDist(branch);
        await buildApp();
        await push(branch);
        await i18n(branch);
        success(`App deployment to ${branch} done`);
        process.exit(0);
    } catch (e) {
        error(e);
    }
})();
