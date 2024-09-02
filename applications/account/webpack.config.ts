import HtmlWebpackPlugin from 'html-webpack-plugin';
// eslint-disable-next-line lodash/import-scope
import template from 'lodash.template';
import path from 'path';
import type webpack from 'webpack';
import 'webpack-dev-server';

import getConfig from '@proton/pack/webpack.config';
import CopyIndexHtmlWebpackPlugin from '@proton/pack/webpack/copy-index-html-webpack-plugin';
import { addDevEntry, getIndexChunks, getSupportedEntry } from '@proton/pack/webpack/entries';

import type { HrefLang } from './pages/interface';
import { getPages } from './pages/pages';
import type { Parameters } from './src/pages/interface';

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

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

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
    const originalTemplateParameters = htmlPlugin.userOptions.templateParameters as { [key: string]: any };

    const { pre, unsupported } = config.entry as any;

    if (env.appMode === 'standalone') {
        config.entry = {
            pre,
            private: [path.resolve('./src/app/private.tsx'), getSupportedEntry()],
            unsupported,
        };

        plugins.splice(
            htmlIndex,
            1,
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: path.resolve('./src/private.ejs'),
                templateParameters: originalTemplateParameters,
                scriptLoading: 'defer' as const,
                chunks: getIndexChunks('private'),
                inject: 'body' as const,
            })
        );

        addDevEntry(config);

        return config;
    }

    config.entry = {
        pre,
        private: [path.resolve('./src/app/private.tsx'), getSupportedEntry()],
        public: [path.resolve('./src/app/public.tsx'), getSupportedEntry()],
        lite: [path.resolve('./src/lite/index.tsx'), getSupportedEntry()],
        storage: path.resolve('./src/app/storage.ts'),
        unsupported,
    };

    const rewrites: any[] = [];
    // @ts-ignore
    config.devServer.historyApiFallback.rewrites = rewrites;

    // Replace the old html webpack plugin with this
    plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'private.html',
            template: path.resolve('./src/private.ejs'),
            templateParameters: originalTemplateParameters,
            scriptLoading: 'defer' as const,
            chunks: getIndexChunks('private'),
            inject: 'body' as const,
        })
    );
    rewrites.push({ from: /^\/u\//, to: '/private.html' });

    plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/public.ejs'),
            templateParameters: originalTemplateParameters,
            scriptLoading: 'defer',
            chunks: getIndexChunks('public'),
            inject: 'body',
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
            chunks: getIndexChunks('lite'),
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

    plugins.push(smp);
    return config;
};

export default result;
