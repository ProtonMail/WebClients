const { bash } = require('./helpers/cli');

const push = async (branch, { tag, originCommit, originBranch }) => {
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
};

const pull = async (branch, force) => {
    const flag = force ? '-f' : '';
    await bash(`git fetch ${flag} origin ${branch}:${branch}`);
    await bash(`git clone file://$PWD --depth 1 --single-branch --branch ${branch} dist`);
    await bash('cd dist && rm -rf *');
};

module.exports = {
    push,
    pull
};
