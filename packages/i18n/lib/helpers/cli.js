const path = require('path');
const execa = require('execa');
const { debug } = require('./log')('proton-i18n');

const bash = (cli, args = [], stdio) => {
    debug({ cli, args, stdio }, 'bash');
    return execa(cli, args, { shell: '/bin/bash', stdio });
};

// 'inherit'
const script = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args, stdio);
};

const scriptNode = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash('node ' + cmd, args, stdio);
};

module.exports = { bash, script, scriptNode };
