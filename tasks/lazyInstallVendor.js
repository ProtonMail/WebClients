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

const args = process.argv.slice(2);
const type = args[0];

const testDeps = [
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
];
const e2eDeps = [
    'cypress@3.0'
];

const install = (testFiles = [], deps = []) => {
    try {
        testFiles.forEach((file) => fs.accessSync(file, fs.constants.R_OK));
        console.log("lazyInstallVendor", "✓ We have a cache.");
    } catch (e) {
        console.log("lazyInstallVendor", "installing dependencies");
        execa('npm', ['i', ...deps, "--no-save"]).stdout.pipe(process.stdout);
    }
};

(async () => {
    try {
        if (type === 'e2e') {
            install(['./node_modules/cypress'], e2eDeps);
        } else if (type === 'test') {
            install(['./node_modules/karma'], testDeps);
        } else {
            install(['./node_modules/karma', './node_modules/cypress'], [...testDeps, ...e2eDeps]);
        }
    } catch (e) {
        console.error(e);
    }
})();
