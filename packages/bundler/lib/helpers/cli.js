const execa = require('execa');

const bash = (cli, args = []) => execa.shell(`${cli} ${args.join(' ')}`, { shell: '/bin/bash' });

module.exports = { bash };
