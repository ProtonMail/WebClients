const execa = require('execa');

const { success, spin } = require('./helpers/log')('proton-i18n');

const protonDep = ['src/app'].concat(
    ['react-components/{co*,helpers}', 'proton-shared/lib'].map((name) => `node_modules/${name}`)
);

async function main() {
    const spinner = spin('Extracting translations');
    try {
        const dest = protonDep.join(' ');
        await execa.shell(`npx ttag extract $(find ${dest} -type f -name '*.js') -o i18n/templates.pot`, {
            shell: '/bin/bash'
        });
        spinner.stop();
        success('Translations extracted to i18n/templates.pot');
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = main;
