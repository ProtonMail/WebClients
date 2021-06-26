const path = require('path');
const execa = require('execa');
const { debug } = require('./log')('proton-i18n');

const bash = (cli, args = [], stdio) => {
    debug({ cli, args, stdio }, 'bash');
    return execa(cli, args, { shell: '/bin/bash', stdio });
};

const curl = (url, optCurl = {}, opt = {}) => {
    const options = Array.isArray(optCurl) ? optCurl : [];

    if (optCurl.file) {
        const { input, output } = optCurl.file;
        options.push(`-F "files[/${output}]=@${input}"`);
    }
    debug({ url, opt, optCurl, options }, 'curl');
    debug(`curl ${options.join(' ')} '${url}'`, 'curl');
    return execa(`curl ${options.join(' ')} '${url}'`, [], { shell: '/bin/bash', ...opt });
};

// 'inherit'
const script = (cli, args = [], stdio) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args, stdio);
};

module.exports = { bash, script, curl };
