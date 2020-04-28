module.exports = (config) => {
    config.set({
        basePath: '..',
        frameworks: ['jasmine'],
        files: ['test/index.spec.js'],
        preprocessors: {
            'test/index.spec.js': ['webpack']
        },
        webpack: {
            mode: 'development',
            resolve: {
                extensions: ['.js', '.ts', '.tsx']
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: { transpileOnly: true }
                            }
                        ],
                        exclude: /node_modules/
                    }
                ]
            },
            devtool: 'inline-source-map'
        },
        webpackMiddleware: {
            stats: 'minimal'
        },
        mime: {
            'text/x-typescript': ['ts', 'tsx']
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        customLaunchers: {
          ChromeHeadlessCI: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox']
          }
        },
        browsers: ['ChromeHeadlessCI'],
        singleRun: true,
        concurrency: Infinity
    });
};
