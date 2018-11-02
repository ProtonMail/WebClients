/**
 #  Install dependencies to run an action
 #   - e2e: cypress
 #   - unit test: karma + jasmine + puppeteer
 #
 #  We install them only if they are not inside the project
 #
 #  Usage:
 #       <command> : install for both e2e and test
 #       <command> e2e : install only for e2e
 #       <command> test : install only for test
 */
const execa = require('execa');
const fs = require('fs');
const _ = require('lodash');

const CYPRESS = './node_modules/cypress';
const KARMA = './node_modules/karma';

const PATHS_TO_DEPS = {
    [CYPRESS]: [
        'cypress@3.0'
    ],
    [KARMA]: [
        'karma',
        'karma-babel-preprocessor',
        'karma-chrome-launcher',
        'karma-cli',
        'karma-coverage',
        'karma-jasmine',
        'karma-junit-reporter',
        'karma-webpack',
        'jasmine-core@2.8',
        'puppeteer@1.6',
    ]
};

const install = (...requestedPaths) => {
    const pathsToInstall = requestedPaths.filter((file) => !fs.existsSync(file));
    if (!pathsToInstall.length) {
        console.log("lazyInstallVendor", "✓ We have a full cache.");
    } else {
        const depsToInstall = _.flatMap(pathsToInstall, (path) => PATHS_TO_DEPS[path]);
        console.log("lazyInstallVendor", "X We will install:", ...depsToInstall);
        execa('npm', ['i', ...depsToInstall, "--no-save"]).stdout.pipe(process.stdout);
    }
};

(async () => {
    try {
        const [command, file, type] = process.argv;

        if (type === 'e2e') {
            install(CYPRESS);
        }
        if (type === 'test') {
            install(KARMA);
        }
        if (!type) {
            install(CYPRESS, KARMA);
        }
    } catch (e) {
        console.error(e);
    }
})();
