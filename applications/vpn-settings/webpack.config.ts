import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { Parameters } from 'proton-account/src/pages/interface';
import { getPages } from 'proton-account/webpack.pages';
import { Configuration } from 'webpack';
import 'webpack-dev-server';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): Configuration => {
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

    return config;
};

export default result;
