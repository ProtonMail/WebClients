const os = require('os');

const { bash, script } = require('./helpers/cli');
const { debug } = require('./helpers/log')('proton-bundler');

const OUTPUT_CLONE = 'dist-deploy';

async function push(branch, { tag = 'v0.0.0', originCommit, originBranch }) {
    // can't use await bash, it doesn't keep the context for next commands :/
    const cmd = [`cd ${OUTPUT_CLONE}`];
    const message = /-prod-/.test(branch) ? `New Release ${tag}` : 'New Release';
    const description = `Based on the commit ${originCommit} on the branch ${originBranch}`;

    if (os.platform() === 'linux') {
        cmd.push('git ls-files --deleted -z | xargs -r -0 git rm');
    } else {
        cmd.push('(git ls-files --deleted -z  || echo:) | xargs -0 git rm');
    }
    cmd.push('git add --all');
    cmd.push(`git commit -m "${message}" -m '${description}'`);
    cmd.push(`git push origin ${branch}`);
    cmd.push('cd ..');
    debug(cmd, 'Push branch');
    return bash(cmd.join(' && '));
}

async function pull(branch, force, fromCi) {
    debug({
        branch,
        force,
        fromCi,
        GIT_REMOTE_URL_CI: process.env.GIT_REMOTE_URL_CI
    });

    // For the CI to force SSH
    if (process.env.GIT_REMOTE_URL_CI && fromCi) {
        await bash(`git remote set-url origin ${process.env.GIT_REMOTE_URL_CI}`);
    }

    await bash(`git clone "$(git remote get-url origin)" --depth 1 --branch ${branch} ${OUTPUT_CLONE}`);
    // New branch is empty, prevent issues
    await bash(`cd ${OUTPUT_CLONE} && git rm -rf . || true`);

    if (process.env.IS_DEBUG_PROTON_BUNDLER === 'true') {
        const { stdout } = await bash('git remote show origin');
        debug(stdout);
    }
}

async function getConfig() {
    const { stdout = '' } = await script('git.sh');

    // Filter empty keys
    return Object.entries(JSON.parse(stdout)).reduce((acc, [key, value]) => (value && (acc[key] = value), acc), {});
}

async function generateChangelog(branch, issueURL, isV4) {
    if (isV4) {
        return script('logcommits.sh', ['changelog-v4']).then(({ stdout }) => console.log(stdout) || stdout);
    }

    const args = ['changelog', `--branch ${branch}`, `--issue-url ${issueURL}`];
    return script('logcommits.sh', args).then(({ stdout }) => console.log(stdout) || stdout);
}

module.exports = {
    getConfig,
    generateChangelog,
    push,
    pull
};
