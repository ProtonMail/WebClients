const path = require('path');
const execa = require('execa');

const bash = (cli, args = [], stdio) => execa.shell(`${cli} ${args.join(' ')}`, { shell: '/bin/bash', stdio });
const script = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args, stdio);
};

module.exports = { bash, script };
