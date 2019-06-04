const { bash } = require('./helpers/cli');
const { title } = require('./helpers/log')('proton-bundler');

async function push(branch, { tag, originCommit, originBranch }) {
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

async function pull(branch, force) {
    const flag = force ? '-f' : '';
    await bash(`git fetch ${flag} origin ${branch}:${branch}`);
    await bash(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    await bash('cd dist && rm -rf *');
}

async function getConfig() {
    const { stdout: branch } = await bash('git rev-parse --abbrev-ref HEAD');
    const { stdout: commit } = await bash('git rev-parse HEAD');
    const { stdout: tag } = await bash('git describe --abbrev=0');

    return { branch, commit, tag };
}

function logCommits(branch, flowType) {
    const [, target] = branch.match(/-(prod|beta|dev|old|tor)/) || [];

    if (!target) {
        return;
    }

    console.log('');
    title('Hash commits');
    const arg = flowType === 'many' ? '' : target;
    return bash(`./tasks/logcommits.sh ${arg}`.trim()).then(({ stdout }) => console.log(stdout));
}

module.exports = {
    getConfig,
    push,
    pull
};
