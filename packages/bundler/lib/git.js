const os = require('os');

const { bash, script } = require('./helpers/cli');
const { title, debug, IS_VERBOSE } = require('./helpers/log')('proton-bundler');

async function push(branch, { tag = 'v0.0.0', originCommit, originBranch }) {
    const commands = ['cd dist'];

    const message = /-prod-/.test(branch) ? `New Release ${tag}` : 'New Release';
    const description = `Based on the commit ${originCommit} on the branch ${originBranch}`;

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
}

async function pull(branch, force, fromCi) {
    const flag = force ? '-f' : '';

    debug({
        branch,
        force,
        fromCi,
        GIT_REMOTE_URL_CI: process.env.GIT_REMOTE_URL_CI
    });

    await bash(`git fetch ${flag} origin ${branch}:${branch}`);
    await bash(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    await bash('cd dist && rm -rf *');

    // For the CI to force SSH
    if (process.env.GIT_REMOTE_URL_CI && fromCi) {
        await bash(`git remote set-url origin ${process.env.GIT_REMOTE_URL_CI}`);
    }

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

function logCommits(branch, flowType) {
    const [, target] = branch.match(/-(prod|beta|dev|old|tor)/) || [];

    if (!target) {
        return;
    }

    console.log('');
    title('Hash commits');
    const arg = flowType === 'many' ? '' : target;
    // Keep log active.
    return script('logcommits.sh', [arg]).then(({ stdout }) => console.log(stdout) || stdout);
}

module.exports = {
    getConfig,
    logCommits,
    push,
    pull
};
