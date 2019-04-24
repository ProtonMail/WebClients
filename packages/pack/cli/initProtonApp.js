const path = require('path');
const fs = require('fs').promises;
const execa = require('execa');
const chalk = require('chalk');
const dedent = require('dedent');

const bash = (cli) => execa.shell(cli, { shell: '/bin/bash' });

const TEMPLATE = path.resolve(__dirname, '..', 'template');
const PATH_APP_PKG = path.join(process.cwd(), 'package.json');

/**
 * Copy the template boilerplate into the root app
 *     - type: default (default) a boilerplate with everything but the auth
 *     - type: auth a boilerplate + private routes
 * @param {String} type type of boilerplate you want to setup
 */
async function main(type = 'default') {
    // Make a copy of the whole src repo
    await bash(`cp -r ${TEMPLATE}/${type} src`);
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

        ➙ Now you can run ${chalk.yellow('npm i')}
        ➙ Once it's done: ${chalk.yellow('npm start')}
    `);
}

module.exports = main;
