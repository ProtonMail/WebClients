#!/usr/bin/env node

const os = require('os');
const { exec, execVerbose } = require('./helpers/command');
const { title, success, error } = require('./helpers/log');

const { CONFIG, branch } = require('../env/config').getConfig('dist');
const { externalFiles } = require('../env/conf.build');

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

const copyFiles = async () => {
    await exec(`cp src/{${externalFiles.list.join(',')}} dist/`);
    success('Files copied');
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

const checkDependencies = async () => {
    await execVerbose('./tasks/checkDependencies.js');
    success('Dependencies ok');
};

(async () => {
    try {
        // Custom local deploy for the CI
        const isCI = process.env.NODE_ENV_DIST === 'ci';

        title(!isCI ? `Deploy with API: ${CONFIG.apiUrl}` : `Build with API: ${CONFIG.apiUrl}`);

        if (!branch && !isCI) {
            throw new Error('You must define a branch name. --branch=XXX');
        }

        process.env.NODE_ENV_BRANCH = branch;
        process.env.NODE_ENV_API = CONFIG.apiUrl;

        await checkDependencies();
        isCI && (await setupConfig());
        await lint();
        !isCI && (await setupConfig());
        !isCI && (await pullDist(branch));
        await copyFiles();
        await buildApp();
        if (!isCI) {
            await push(branch);
            await i18n(branch);
        }
        !isCI && success(`App deployment to ${branch} done`);
        isCI && success('Build CI app to the directory: dist');
        process.exit(0);
    } catch (e) {
        error(e);
    }
})();
