const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const dedent = require('dedent');

const { success } = require('./helpers/log');
const { bash } = require('./helpers/cli');

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
    // Copy assets
    await bash(`cp -r ${TEMPLATE}/assets src/assets`);
    // Copy basic i18n setup
    await bash(`cp -r ${TEMPLATE}/po po`);
    // Copy hidden config files
    await bash(`cp -r ${TEMPLATE}/.{editorconfig,eslintrc.json,prettierrc} .`);

    if (type === 'auth') {
        // Copy tsconfig
        await bash(`cp -r ${TEMPLATE}/tsconfig.json .`);
    }

    // Copy config tmp
    await bash(`cp -r ${TEMPLATE}/circle.yml .`);
    // Copy custom gitignore as during the npm install .gitignore is removed... wtf
    await bash(`cp -r ${TEMPLATE}/_gitignore .gitignore`);
    await bash(`cp ${TEMPLATE}/Readme.md Readme.md`);
    await bash('echo {} > appConfig.json');

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
            - Circle.ci config (lint js + i18n)
            - Husky + lint-staged
            - React
            - Deploy ready, you will need to create an empty branch: deploy-x
            - npm scripts
                - ${chalk.yellow('start')}: dev server
                - ${chalk.yellow('deploy')}: deploy
                - ${chalk.yellow('pretty')}: run prettier
                - ${chalk.yellow('i18n:getlatest')}: upgrade translations inside your app
                - Hook postversion for pushing git tag

        ➙ Now you can run ${chalk.yellow('npm i')}
        ➙ Once it's done: ${chalk.yellow('npm start')}
    `);
    console.log();
    success('Setup done, do not forget about the appConfig.json');
}

module.exports = main;
