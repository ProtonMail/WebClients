import karmaChromeLauncher from 'karma-chrome-launcher';
import karmaJasmine from 'karma-jasmine';
import karmaWebpack from 'karma-webpack';
import { chromium } from 'playwright';

process.env.CHROME_BIN = chromium.executablePath();

export default (config) => {
    config.set({
        basePath: '..',
        frameworks: ['jasmine', 'webpack'],
        plugins: [karmaJasmine, karmaWebpack, karmaChromeLauncher],
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
                        test: /\.m?js$/,
                        resolve: { fullySpecified: false },
                    },
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
        reporters: ['progress'],
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
