import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import browserslist from 'browserslist';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import type { Compiler, Configuration } from 'webpack';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader.swc';

import { webpackOptions } from './webpack.options';
import plugins from './webpack.plugins';

const { isProduction } = webpackOptions;

// This renderer ships inside Electron, so it targets the bundled Chromium version
// (the [electron-applications] section of the root .browserslistrc) rather than the web matrix.
const browserslistEnv = 'electron-applications';
const browserslistQuery = browserslist(null, { env: browserslistEnv }).join(', ');

/** Forge names every config of a renderer group `group_N`, including its preload. The dev server pairs
 * hot events by compiler name: a shared name makes the renderer apply the preload's hash and loop on 404. */
const nameCompilerByOutput = {
    apply: (compiler: Compiler) => {
        const preload = String(compiler.options.output.filename).endsWith('preload.js');
        compiler.name = compiler.options.name = preload ? 'preload' : 'renderer';
    },
};

const config: Configuration = {
    target: `browserslist:${browserslistEnv}`,
    mode: isProduction ? 'production' : 'development',
    bail: isProduction,
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    watchOptions: {
        ignored: /dist|node_modules|locales|\.(gif|jpeg|jpg|ico|png|svg)/,
        aggregateTimeout: 600,
    },
    resolve: {
        extensions: ['.js', '.tsx', '.ts'],
        fallback: {
            crypto: false,
            buffer: false,
            stream: false,
            iconv: false,
            path: false,
            punycode: false,
        },
        alias: {
            'proton-pass-web': path.resolve(__dirname, '../pass/src/'),
            'proton-pass-desktop': path.resolve(__dirname, 'src/'),
            'proton-pass-desktop-native': path.resolve(__dirname, 'native/'),
        },
    },
    module: {
        strictExportPresence: true,
        rules: [
            ...getJsLoaders({ ...webpackOptions, browserslist: browserslistQuery, hasReactRefresh: false }),
            ...getCssLoaders({ browserslist: undefined, noLogicalScss: true }),
            ...getAssetsLoaders(),
        ],
    },
    plugins: [
        ...plugins,
        nameCompilerByOutput,
        new ReactRefreshWebpackPlugin(),
        new MiniCssExtractPlugin({ filename: 'styles/[name].css' }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
};

export default config;
