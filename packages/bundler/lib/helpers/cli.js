const path = require('path');
const execa = require('execa');

const bash = (cli, args = []) => execa.shell(`${cli} ${args.join(' ')}`, { shell: '/bin/bash' });
const script = (cli, args = []) => {
    const cmd = path.resolve(__dirname, '..', '..', 'scripts', cli);
    return bash(cmd, args);
};

module.exports = { bash, script };
