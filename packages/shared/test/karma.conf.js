const karmaJasmine = require('karma-jasmine');
const karmaWebpack = require('karma-webpack');
const karmaSpecReporter = require('karma-spec-reporter');
const karmaChromeLauncher = require('karma-chrome-launcher');
const karmaJunitReporter = require('karma-junit-reporter');
const { chromium } = require('playwright');
const { existsSync } = require('node:fs');
process.env.CHROME_BIN = chromium.executablePath();

if (!existsSync(process.env.CHROME_BIN)) {
    throw new Error('Chromium executable not found. Run `npx playwright install chromium`');
}

module.exports = (config) => {
    config.set({
        basePath: '..',
        frameworks: ['jasmine', 'webpack'],
        plugins: [karmaJasmine, karmaWebpack, karmaChromeLauncher, karmaSpecReporter, karmaJunitReporter],
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
                                options: { transpileOnly: true },
                            },
                        ],
                        exclude: /node_modules\/(?!.*(bip39|pmcrypto))/,
                    },
                ],
            },
            devtool: 'inline-source-map',
        },
        mime: {
            'text/x-typescript': ['ts', 'tsx'],
        },
        reporters: ['spec', 'junit'],
        junitReporter: {
            outputDir: '', // results will be saved as $outputDir/$browserName.xml
            outputFile: 'test-report.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: '', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
        },
        specReporter: {
            suppressSkipped: true, // do not print information about skipped tests
        },
        port: 9874,
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
        client: {
            jasmine: {
                timeoutInterval: 10000,
            },
        },
    });
};
