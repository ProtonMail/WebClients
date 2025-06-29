const path = require('path');
const os = require('os');
const { firefox, chromium, webkit } = require('playwright');
const karmaJasmine = require('karma-jasmine');
const karmaWebpack = require('karma-webpack');
const karmaChromeLauncher = require('karma-chrome-launcher');
const karmaFirefoxLauncher = require('karma-firefox-launcher');
const karmaWebkitLauncher = require('karma-webkit-launcher');
const karmaSpecReporter = require('karma-spec-reporter');
process.env.CHROME_BIN = chromium.executablePath();
process.env.FIREFOX_BIN = firefox.executablePath();
process.env.WEBKIT_HEADLESS_BIN = webkit.executablePath();

/**
 * Karma does not automatically serve the bundled webworker asset generated by webpack,
 * so we need to manually reference and expose the webpack temporary output dir.
 * See: https://github.com/ryanclark/karma-webpack/issues/498#issuecomment-790040818
 */
const karmaWebpackOutputPath = path.join(os.tmpdir(), '_karma_webpack_') + Math.floor(Math.random() * 1000000);

module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '..',

        // frameworks to use
        // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
        frameworks: ['jasmine', 'webpack'],

        plugins: [
            karmaJasmine,
            karmaWebpack,
            karmaChromeLauncher,
            process.env.CI ? undefined : karmaFirefoxLauncher,
            karmaWebkitLauncher,
            karmaSpecReporter,
        ].filter(Boolean),

        // list of files / patterns to load in the browser
        files: [
            { pattern: 'test/**/!(karma.conf).*', watched: false },
            {
                pattern: `${karmaWebpackOutputPath}/**/*`,
                watched: false,
                included: false,
                served: true,
            },
        ],

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
        preprocessors: {
            'test/**/*.*': 'webpack',
        },

        webpack: {
            output: {
                path: karmaWebpackOutputPath,
            },

            resolve: {
                fallback: {
                    stream: false,
                    buffer: false,
                },
                extensions: ['', '.js', '.ts'],
            },
            module: {
                rules: [
                    {
                        test: /\.ts?$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: {
                                    compilerOptions: { noEmit: false },
                                    allowTsInNodeModules: true,
                                },
                            },
                        ],
                        exclude: /node_modules\/(?!.*(pmcrypto))/,
                    },
                ],
            },
        },

        // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
        reporters: ['spec'],

        // web server port
        port: 9875,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
        },
        browsers: [
            'ChromeHeadlessCI',
            process.env.CI ? undefined : 'FirefoxHeadless',
            // on Linux, we don't want to test webkit as the WebCrypto X25519 implementation has issues.
            // To detech the OS, we look at the playwright installation path, see
            // https://playwright.dev/python/docs/browsers#managing-browser-binaries
            webkit.executablePath().includes('.cache') ? undefined : 'WebkitHeadless',
        ].filter(Boolean),

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser instances should be started simultaneously
        concurrency: Infinity,

        client: {
            jasmine: {
                // Run tests in serial so that endpoint release don't interfere
                random: false,
                // timeout for tests, default is 2 seconds. Some streaming tests can take longer.
                timeoutInterval: 30000,
            },
        },
    });
};
