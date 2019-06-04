const { bash } = require('./helpers/cli');
const { title } = require('./helpers/log')('proton-bundler');

function getCommits(branch, flowType) {
    const [, target] = branch.match(/-(prod|beta|dev|old|tor)/) || [];

    if (!target) {
        return;
    }

    console.log('');
    title('Hash commits');
    const arg = flowType === 'many' ? '' : target;
    return bash(`./tasks/logcommits.sh ${arg}`.trim()).then(({ stdout }) => console.log(stdout));
}

module.exports = { getCommits };
