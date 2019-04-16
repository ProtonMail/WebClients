const execa = require('execa');

const { success } = require('./helpers/log');

function main() {
  execa.shellSync("npx ttag extract $(find src/app -type f -name '*.js') -o i18n/templates.pot", { shell: '/bin/bash' });
  success('Translations extracted to i18n/templates.pot');
}

module.exports = main;