const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const getAlias = require('proton-pack/webpack/alias');
const { getJsLoader } = require('proton-pack/webpack/js.loader');
const getCssLoaders = require('proton-pack/webpack/css.loader');
const getAssetsLoaders = require('proton-pack/webpack/assets.loader');

module.exports = {
    webpackFinal: async (config, { configType }) => {
        const isProduction = configType === 'PRODUCTION';

        const options = {
            isProduction,
            hasReactRefresh: false
        };

        return {
            ...config,
            resolve: {
                ...config.resolve,
                alias: {
                    ...config.resolve.alias,
                    ...getAlias(),
                }
            },
            module: {
                ...config.module,
                rules: [
                    ...config.module.rules.filter((rule) => {
                        return rule.test.toString().includes('mdx');
                    }),
                    ...[getJsLoader(options), ...getCssLoaders(options), ...getAssetsLoaders(options)],
                ],
            },
            plugins: [
                ...config.plugins,
                new MiniCssExtractPlugin({
                    filename: isProduction ? '[name].[contenthash:8].css' : '[name].css',
                    chunkFilename: isProduction ? '[id].[contenthash:8].css' : '[id].css'
                }),
            ]
        };
    },
    module: {
        rules: [
            {
                test: /\.stories\.tsx?$/,
                loaders: [
                    {
                        loader: require.resolve('@storybook/source-loader'),
                        options: { parser: 'typescript' },
                    },
                ],
                enforce: 'pre',
            },
        ],
    },
    stories: ['../src/stories/*.stories.*'],
    addons: [
        {
            name: '@storybook/addon-docs',
            options: {
                sourceLoaderOptions: {
                    parser: 'typescript',
                    injectStoryParameters: true,
                },
            },
        },
        '@storybook/addon-essentials',
        {
            
            name: '@storybook/addon-storysource',
            options: {
                sourceLoaderOptions: {
                    parser: 'typescript',
                    injectStoryParameters: true,
                },
            },
        }
    ],
    typescript: {
        check: false,
        checkOptions: {},
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
        shouldExtractLiteralValuesFromEnum: true,
        propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        },
    },
};
