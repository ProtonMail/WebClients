process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = (config) => {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'mock.js',
            '../build/vendor.js',
            '!../build/openpgp.worker.min.js',
            '../build/openpgp.min.js',
            '../build/templates.js',
            // '../build/app.js',
            // '../build/appLazy.js',
            '../node_modules/angular-mocks/angular-mocks.js',
            '../src/templates/**/*.html',
            'specs/**/*.js'
            // 'mocks/**/*.js'
        ],

        // list of files to exclude
        preprocessors: {
            '../src/templates/**/*.html': ['ng-html2js'],
            '../src/app/*.js': ['webpack'],
            '../src/app/**/*.js': ['webpack'],
            '../src/app/**/**/*.js': ['webpack'],
            'specs/**/*.js': ['webpack', 'coverage']
        },

        ngHtml2JsPreprocessor: {
            stripPrefix: '.*/src/',
            moduleName: 'test.templates'
        },

        // optionally, configure the reporter
        coverageReporter: {
            instrumenterOptions: { istanbul: { noCompact: true } },
            reporters: [
                { type: 'html', dir: 'coverage/' },
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

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        autoWatch: false,
        // browsers: ['PhantomJS'],
        browsers: ['ChromeHeadless'],
        singleRun: true
    });
};
