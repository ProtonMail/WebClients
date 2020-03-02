const os = require('os');

const { bash, script } = require('./helpers/cli');
const { debug, IS_VERBOSE } = require('./helpers/log')('proton-bundler');

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
    await bash(`cd ${OUTPUT_CLONE} && rm -rf *`);

    if (IS_VERBOSE) {
        const { stdout } = await bash('git remote show origin');
        debug(stdout);
    }
}

async function getConfig() {
    const { stdout: branch } = await bash('git rev-parse --abbrev-ref HEAD');
    const { stdout: commit } = await bash('git rev-parse HEAD');

    try {
        const { stdout: tag } = await bash('git describe --abbrev=0');
        return { branch, commit, tag };
    } catch (e) {
        // If no tag it crashes
        return { branch, commit };
    }
}

async function logCommits(branch = '', flowType, isWebsite) {
    const [, target] = branch.match(/-(prod|beta|dev|old|tor)/) || [];

    if (!target) {
        return;
    }
    const args = [flowType === 'many' ? '' : target];
    isWebsite && args.push('--website');

    // Keep log active.
    return script('logcommits.sh', args).then(({ stdout }) => stdout);
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
    logCommits,
    generateChangelog,
    push,
    pull
};
