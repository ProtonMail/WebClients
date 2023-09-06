import HtmlWebpackPlugin from 'html-webpack-plugin';
import template from 'lodash.template';
import path from 'path';
import webpack from 'webpack';
import 'webpack-dev-server';

import getConfig, { mergeEntry } from '@proton/pack/webpack.config';
import CopyIndexHtmlWebpackPlugin from '@proton/pack/webpack/copy-index-html-webpack-plugin';

import { HrefLang } from './pages/interface';
import { getPages } from './pages/pages';
import { Parameters } from './src/pages/interface';

const getTemplateParameters = (
    originalTemplateParameters: any,
    hreflangs: HrefLang[],
    shortLocalizedPathname: string,
    parameters: Parameters & { pathname: string }
) => {
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

const result = async (env: any): Promise<webpack.Configuration> => {
    const pagePromise = getPages();

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

    // Replace the old html webpack plugin with this
    plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/app.ejs'),
            scriptLoading: 'defer' as const,
            excludeChunks: ['storage', 'lite'],
            inject: 'body' as const,
        })
    );

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

    const { pages, hreflangs } = await pagePromise;

    pages.forEach(({ rewrite }) => {
        rewrites.push(rewrite);
    });

    plugins.push(
        new CopyIndexHtmlWebpackPlugin((source) => {
            const compiled = template(
                source,
                // Note: We use two different template interpolations, due to <%= require('./favicon.svg' %>, which requires
                // a lot more effort to support properly, so we use the default loader for that and our own loader for this.
                {
                    evaluate: /\{\{([\s\S]+?)\}\}/g,
                    interpolate: /\{\{=([\s\S]+?)\}\}/g,
                    escape: /\{\{-([\s\S]+?)\}\}/g,
                },
                undefined
            );

            const index = {
                name: 'index.html',
                data: compiled(
                    getTemplateParameters(originalTemplateParameters, hreflangs, '', {
                        title: originalTemplateParameters.appName,
                        description: originalTemplateParameters.description,
                        pathname: '/',
                    })
                ),
            };

            const rest = pages.map(({ shortLocalizedPathname, filename, parameters }) => {
                return {
                    name: filename,
                    data: compiled(
                        getTemplateParameters(originalTemplateParameters, hreflangs, shortLocalizedPathname, parameters)
                    ),
                };
            });
            return [index, ...rest];
        })
    );

    return config;
};

export default result;
