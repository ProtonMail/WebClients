const path = require('path');
const fs = require('fs').promises;
const execa = require('execa');
const chalk = require('chalk');
const dedent = require('dedent');

const bash = (cli) => execa.shell(cli, { shell: '/bin/bash' });

const TEMPLATE = path.resolve(__dirname, '..', 'template');
const PATH_APP_PKG = path.join(process.cwd(), 'package.json');

/**
 * Copy the template boilerplate into the root ap
 */
async function main() {
    // Make a copy of the whole src repo
    await bash(`cp -r ${TEMPLATE}/src src`);
    // Copy hidden config files
    await bash(`cp -r ${TEMPLATE}/.{editorconfig,eslintrc.json,prettierrc} .`);
    // Copy custom gitignore as during the npm install .gitignore is removed... wtf
    await bash(`cp -r ${TEMPLATE}/_gitignore .gitignore`);

    const pkgTpl = require('../template/package.json');
    const pkgApp = require(PATH_APP_PKG);

    // Extend the config with the boilerplate's one
    const pkg = {
        ...pkgApp,
        ...pkgTpl,
        devDependencies: {
            ...pkgApp.devDependencies,
            ...pkgTpl.devDependencies
        }
    };

    // Prout
    await fs.writeFile(PATH_APP_PKG, JSON.stringify(pkg, null, 4));

    console.log(dedent`
        🎉 ${chalk.green('Your app is ready')}

        Here is what's available for this setup:
            - EditorConfig
            - Eslint
            - Prettier
            - Husky + lint-staged
            - React
            - npm scripts
                - ${chalk.yellow('start')}: dev server
                - Hook postversion for pushing git tag

        ➙ Now you can run ${chalk.yellow('npm start')}
    `);
}

module.exports = main;
