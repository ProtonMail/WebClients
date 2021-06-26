const path = require('path');
const execa = require('execa');
const { debug } = require('./log');

const sync = (cli) => execa.sync(cli, { shell: true });

const bash = (cli, args = [], stdio) => {
    debug({ cli, args, stdio }, 'shell command');
    return execa(cli, args, { shell: '/bin/bash', stdio });
};

const script = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args, stdio);
};

module.exports = { bash, script, sync };
