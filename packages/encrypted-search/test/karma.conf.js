const karmaJasmine = require('karma-jasmine');
const karmaWebpack = require('karma-webpack');
const karmaSpecReporter = require('karma-spec-reporter');
const karmaChromeLauncher = require('karma-chrome-launcher');
const { chromium } = require('playwright');
process.env.CHROME_BIN = chromium.executablePath();

module.exports = (config) => {
    config.set({
        basePath: '..',
        frameworks: ['jasmine', 'webpack'],
        plugins: [karmaJasmine, karmaWebpack, karmaChromeLauncher, karmaSpecReporter],
        files: ['test/index.spec.js'],
        preprocessors: {
            'test/index.spec.js': ['webpack'],
        },
        webpack: {
            mode: 'development',
            resolve: {
                extensions: ['.js', '.ts', '.tsx'],
                fallback: {
                    crypto: false,
                    buffer: false,
                    stream: false,
                },
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: {
                                    transpileOnly: true,
                                    compilerOptions: {
                                        jsx: 'react-jsx',
                                    },
                                },
                            },
                        ],
                        exclude: /node_modules\/(?!.*pmcrypto)/,
                    },
                    {
                        test: /\.(svg|woff|woff2|eot|ttf|otf|mp4|webm|pdf|csv)$/,
                        type: 'asset/resource',
                    },
                ],
            },
            devtool: 'inline-source-map',
        },
        mime: {
            'text/x-typescript': ['ts', 'tsx'],
        },
        reporters: ['spec'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
        },
        browsers: ['ChromeHeadlessCI'],
        singleRun: true,
        concurrency: Infinity,
    });
};
