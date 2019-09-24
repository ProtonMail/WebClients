const path = require('path');
const execa = require('execa');
const { debug } = require('./log')('proton-bundler');

const bash = (cli, args = [], stdio) => {
    debug({ cli, args, stdio }, 'bash');
    return execa(cli, args, { shell: '/bin/bash', stdio });
};

const script = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args, stdio);
};

module.exports = { bash, script };
