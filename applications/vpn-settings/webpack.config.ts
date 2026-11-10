import HtmlWebpackPlugin from 'html-webpack-plugin';
import template from 'lodash/template';
import type { HrefLang } from 'proton-account/pages/interface';
import { getPages } from 'proton-account/pages/pages';
import type { Parameters } from 'proton-account/src/pages/interface';
import type { Configuration } from 'webpack';
import 'webpack-dev-server';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { getConfig } from '@proton/pack/webpack.config';
import CopyIndexHtmlWebpackPlugin from '@proton/pack/webpack/copy-index-html-webpack-plugin';

import appConfig from './appConfig';

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

const result = async (opts: WebpackEnvArguments): Promise<Configuration> => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig(webpackOptions);
    const pagesPromise = getPages();
    const plugins = config.plugins || [];
    config.plugins = plugins;

    const htmlPlugin = plugins.find((plugin): plugin is HtmlWebpackPlugin => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    if (!htmlPlugin) {
        throw new Error('Missing html plugin');
    }

    const rewrites: any[] = [];
    // @ts-ignore
    config.devServer.historyApiFallback.rewrites = rewrites;

    const originalTemplateParameters = htmlPlugin.userOptions.templateParameters as { [key: string]: any };

    const { pages, hreflangs } = await pagesPromise;

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
                }
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
