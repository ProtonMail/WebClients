import fs from 'fs';
import path from 'path';
import type { Configuration } from 'webpack';
import webpack from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { getConfig } from '@proton/pack/webpack.config';
import { addDevEntry } from '@proton/pack/webpack/entries';

import appConfig from './appConfig';
// Import custom optimization for better markdown/syntax highlighting chunking
import getLumoOptimizations from './webpack.optimization';

/**
 * Load custom Lumo public key from file path if LUMO_PUB_KEY_PATH is set
 * Returns null if not set or if loading fails
 */
function loadCustomLumoPubKey(): string | null {
    const keyPath = process.env.LUMO_PUB_KEY_PATH;
    if (!keyPath) {
        return null;
    }

    try {
        const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.resolve(keyPath);
        const key = fs.readFileSync(resolvedPath, 'utf-8').trim();
        console.log(`[Lumo] Using custom public key from: ${resolvedPath}`);
        return key;
    } catch (error) {
        console.warn(`[Lumo] Failed to load custom public key from ${keyPath}:`, error);
        throw new Error(`Cannot load PGP key at ${keyPath}`);
    }
}

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig(webpackOptions);

    // Override optimization with Lumo-specific configuration for better code splitting
    config.optimization = getLumoOptimizations(webpackOptions);
    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }
    // @ts-ignore
    const _scssRule = config.module.rules.find((rule) => rule.test.toString().includes('scss'));

    // Inject custom Lumo public key if provided via LUMO_PUB_KEY_PATH
    config.plugins = config.plugins || [];
    const customKey = loadCustomLumoPubKey();
    if (customKey) {
        config.plugins.push(
            new webpack.DefinePlugin({
                LUMO_CUSTOM_PUB_KEY: JSON.stringify(customKey),
            })
        );
    }

    // Exclude all mock-related files from production builds
    if (webpackOptions.isProduction) {
        config.plugins.push(
            new (require('webpack').IgnorePlugin)({
                resourceRegExp: /[\\/](mocks|__mocks__)[\\/]|mockServiceWorker\.js$/,
            })
        );
    }

    // @ts-ignore
    config.module.rules.push({
        test: /\.worker$/,
        loader: 'file-loader',
        options: {
            // @ts-ignore
            outputPath(_url, _resourcePath, _context) {
                return 'assets/';
            },
        },
    });
    //
    // // @ts-ignore
    // config.entry ??= {};
    // // @ts-ignore
    // config.entry['service-worker'] = './src/app/remote/service-worker/worker.ts';
    //
    // // @ts-ignore
    // config.output ??= {};
    // config.output.filename = (pathData) => {
    //     // @ts-ignore
    //     if (pathData.chunk.name === 'service-worker') {
    //         return 'service-worker.js';
    //     }
    //     return '[name].[contenthash].js';
    // };
    //
    return config;
};

export default result;
