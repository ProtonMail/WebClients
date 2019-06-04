const execa = require('execa');

const bash = (cli) => execa.shell(cli, { shell: '/bin/bash' });

module.exports = { bash };
