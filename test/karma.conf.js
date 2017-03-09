module.exports = (config) => {

    config.set({

        basePath: '',
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            '../build/vendor/angular.js',
            '../build/vendor/jquery.js',
            '../src/app/libraries/*.js',
            '../build/vendor/*.js',
            '../node_modules/angular-mocks/angular-mocks.js',
            '../src/app/config.js',
            '../src/app/constants.js',
            '../src/app/templates/**/*.html',
            '../src/app/*.js',
            '../src/app/**/index.js',
            '../src/app/**/*.js',
            'specs/**/*.js'
            // 'mocks/**/*.js'
        ],


        // list of files to exclude
        exclude: ['**/*.min.js', '../src/app/libraries/*.js'],
        preprocessors: {
            '../src/app/templates/**/*.html': ['ng-html2js'],
            '../src/app/**/**/*.js': ['babel'],
            '../src/app/**/*.js': ['babel'],
            'specs/**/*.js': ['babel']
        },

        ngHtml2JsPreprocessor: {
            stripPrefix: '.*\/src\/app\/',
            moduleName: 'test.templates'
        },

        // optionally, configure the reporter
        coverageReporter: {
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
        browsers: ['PhantomJS'],
        singleRun: true
    });
};
