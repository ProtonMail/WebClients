import path from 'path';
import webpack from 'webpack';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';

import getConfig from '@proton/pack/webpack.config';

const CRITICAL_OFFLINE_ASSETS = [
    /** main assets */
    'index.css',
    'index.html',
    'index.js',

    /* runtime */
    'pre.js',
    'runtime.js',
    'unsupported.js',

    /* workers */
    'core.worker.js',
    'crypto-worker.js',

    /* wasm */
    'wasm',
    'vendors-node_modules_protontech_pass-rust-core_proton_pass_web_js.chunk.js',
    'vendors-node_modules_pmcrypto_node_modules_openpgp_dist_lightweight_argon2id_min_mjs',
];

const result = (env: any): webpack.Configuration => {
    const config = getConfig(env);
    const version = env.version;

    config.plugins?.push(
        new webpack.DefinePlugin({
            BUILD_TARGET: JSON.stringify('web'),
            ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
            OFFLINE_SUPPORTED: true,
        })
    );

    if (config.resolve) config.resolve.alias = { 'proton-pass-web': path.resolve(__dirname, 'src/') };
    if (config.devServer) config.devServer.headers = { 'Service-Worker-Allowed': '/' };

    if (config.output) {
        const chunkFilename = config.output.chunkFilename;
        config.output.chunkFilename = (pathData, assetInfo) => {
            const chunkName = pathData?.chunk?.name;
            if (chunkName && chunkName.startsWith('pass.service-worker')) return `[name].js?v=${version}`;
            if (typeof chunkFilename === 'function') return chunkFilename(pathData, assetInfo);
            return chunkFilename ?? '[id].js';
        };

        config.output.webassemblyModuleFilename = 'assets/[hash].wasm';
    }

    if (config.plugins) {
        config.plugins.push(
            new WebpackManifestPlugin({
                fileName: 'assets/offline.json',
                filter: (file) => {
                    /** exclude sourcemaps */
                    if (file.name.includes('.map')) return false;
                    return CRITICAL_OFFLINE_ASSETS.some((asset) => file.name.includes(asset));
                },
            })
        );
    }

    config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
    };

    return config;
};

export default result;
