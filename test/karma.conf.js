process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = (config) => {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'specs/index.js'
        ],

        webpack: {
            mode: 'development',
            module: {
                rules: [
                    ...require('../webpack.tasks/js.loader'),
                     // Use a simple css loader because karma-webpack does not work with ours
                    ...require('../webpack.tasks/css.tests.loader'),
                    ...require('../webpack.tasks/templates.loader'),
                    ...require('../webpack.tasks/assets.loader')
                ]
            },
            plugins: require('../webpack.tasks/plugins'),
            resolve: {
                alias: {
                    iconv: 'iconv-lite'
                }
            }
        },

        preprocessors: {
            'specs/index.js': ['webpack', 'coverage']
        },

        // optionally, configure the reporter
        coverageReporter: {
            instrumenterOptions: { istanbul: { noCompact: true } },
            reporters: [
                // { type: 'html', dir: 'coverage/' },
                { type: 'clover', dir: 'coverage/clover/' }
            ]
        },

        reporters: ['progress', 'coverage', 'junit'],
        junitReporter: {
            outputDir: 'coverage',
            outputFile: 'test-results.xml'
        },
        port: 9876,
        colors: true,

        webpackMiddleware: {
            stats: 'minimal'
        },

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadless'],
        singleRun: true
    });
};
