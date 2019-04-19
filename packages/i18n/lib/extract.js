const execa = require('execa');

const { success, spin } = require('./helpers/log')('proton-i18n');

const protonDep = ['src/app'].concat(
    ['react-components/{co*,helpers}', 'proton-shared/lib'].map((name) => `node_modules/${name}`)
);

async function extractor() {
    if (process.env.APP_KEY === 'Angular') {
        return execa.shell(
            `npx angular-gettext-cli --files './src/+(app|templates)/**/**/*.+(js|html)' --dest po/template.pot --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"`,
            {
                shell: '/bin/bash'
            }
        );
    }

    const dest = protonDep.join(' ');
    return execa.shell(`npx ttag extract $(find ${dest} -type f -name '*.js') -o po/template.pot`, {
        shell: '/bin/bash'
    });
}

async function main() {
    const spinner = spin('Extracting translations');
    try {
        await extractor();
        spinner.stop();
        success('Translations extracted to po/templates.pot');
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = main;
