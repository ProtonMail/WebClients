module.exports = (config) => {
    config.set({
        basePath: '..',
        frameworks: ['jasmine'],
        files: ['test/index.spec.js'],
        preprocessors: {
            'test/index.spec.js': ['webpack']
        },
        webpack: {
            mode: 'development'
        },
        webpackMiddleware: {
            stats: 'minimal'
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadless'],
        singleRun: true,
        concurrency: Infinity
    });
};
