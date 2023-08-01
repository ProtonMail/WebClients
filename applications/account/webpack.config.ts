import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import 'webpack-dev-server';

import getConfig, { mergeEntry } from '@proton/pack/webpack.config';

import { Parameters } from './src/pages/interface';
import { getPages } from './webpack.pages';

const result = (env: any): webpack.Configuration => {
    const config = getConfig(env);

    const plugins = config.plugins || [];
    config.plugins = plugins;

    const htmlPlugin = plugins.find((plugin): plugin is HtmlWebpackPlugin => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    if (!htmlPlugin) {
        throw new Error('Missing html plugin');
    }
    const htmlIndex = plugins.indexOf(htmlPlugin);

    config.entry = mergeEntry(config.entry, {
        lite: [path.resolve('./src/lite/index.tsx'), require.resolve('@proton/shared/lib/supported/supported.ts')],
        storage: path.resolve('./src/app/storage.ts'),
    });

    const rewrites: any[] = [];
    // @ts-ignore
    config.devServer.historyApiFallback.rewrites = rewrites;

    const originalTemplateParameters = htmlPlugin.userOptions.templateParameters as { [key: string]: any };

    const { pages, hreflangs } = getPages(
        config.mode === 'production' ? () => true : (locale) => locale.startsWith('fr'),
        (path) => require(path)
    );

    const getTemplateParameters = (shortLocalizedPathname: string, parameters: Parameters & { pathname: string }) => {
        let url = originalTemplateParameters.url;
        const origin = url.replace(/\/$/, '');
        if (parameters.pathname) {
            url = `${origin}${parameters.pathname}`;
        }
        return {
            ...originalTemplateParameters,
            ...parameters,
            url,
            hreflangs: hreflangs.map(({ hreflang, pathname }) => {
                return {
                    hreflang,
                    href: `${origin}${pathname}${parameters.pathname.replace(shortLocalizedPathname, '')}`,
                };
            }),
        };
    };

    const defaultOptions = {
        template: path.resolve('./src/app.ejs'),
        scriptLoading: 'defer' as const,
        excludeChunks: ['storage', 'lite'],
        inject: 'body' as const,
    };

    // Replace the old html webpack plugin with this
    plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            ...defaultOptions,
            templateParameters: getTemplateParameters('', {
                title: originalTemplateParameters.appName,
                description: originalTemplateParameters.description,
                pathname: '/',
            }),
        })
    );

    pages.forEach(({ shortLocalizedPathname, rewrite, filename, parameters }) => {
        rewrites.push(rewrite);

        plugins.splice(
            htmlIndex,
            0,
            new HtmlWebpackPlugin({
                filename,
                ...defaultOptions,
                templateParameters: getTemplateParameters(shortLocalizedPathname, parameters),
            })
        );
    });

    plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'storage.html',
            template: path.resolve('./src/storage.ejs'),
            templateParameters: originalTemplateParameters,
            scriptLoading: 'defer',
            chunks: ['storage'],
            inject: 'body',
        })
    );

    rewrites.push({ from: /^\/lite/, to: '/lite/index.html' });
    plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'lite/index.html',
            template: path.resolve('./src/lite.ejs'),
            templateParameters: originalTemplateParameters,
            scriptLoading: 'defer',
            chunks: ['pre', 'lite', 'unsupported'],
            inject: 'body',
        })
    );

    return config;
};

export default result;
