const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getJsLoader } = require('@proton/pack/webpack/js.loader');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');

module.exports = {
    core: {
        builder: 'webpack5',
    },
    stories: [
        '../src/stories/**/*.stories.@(mdx|js|jsx|ts|tsx)',
        '../../../packages/atoms/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    addons: ['@storybook/addon-links', '@storybook/addon-storysource', '@storybook/addon-essentials'],
    staticDirs: ['../src/assets', '../src/assets/favicons'],
    typescript: {
        check: false,
        checkOptions: {},
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldRemoveUndefinedFromOptional: true,
            propFilter: (property) => {
                if (property.parent) {
                    /**
                     * Only generate docs for properties which are not a part of the @types
                     * package. That way we don't get all the inherited dom attributes for
                     * example from "React.FC<React.HTMLAttributes<HTMLDivElement>>".
                     *
                     * Usually examples covered in Storybook docs as well as react-docgen-typescript
                     * itself show a different code-snippet to deal with this, one which ignores
                     * solely based on "node_modules".
                     *
                     * Since we're defining the components used in our storybook outside this codebase
                     * and importing it through node_modules, that won't do for us, we need to be
                     * more specific.
                     */
                    return !property.parent.fileName.includes('/node_modules/@types/');
                }

                return true;
            },
        },
    },
    webpackFinal: async (config, { configType }) => {
        const isProduction = configType === 'PRODUCTION';

        const options = {
            isProduction,
            hasReactRefresh: false,
        };

        return {
            ...config,
            resolve: {
                ...config.resolve,
                fallback: {
                    ...config.resolve.fallback,
                    // For some reason storybook brings in openpgp as a dependency and we need to
                    // explicitly disable these in the webpack config
                    stream: false,
                    crypto: false,
                },
            },
            module: {
                ...config.module,
                rules: [
                    ...config.module.rules.filter((rule) => {
                        return rule.test.toString().includes('mdx');
                    }),
                    {
                        test: /\.stories\.(tsx|mdx)?$/,
                        use: [
                            {
                                loader: require.resolve('@storybook/source-loader'),
                                options: { parser: 'typescript' },
                            },
                        ],
                        enforce: 'pre',
                    },
                    ...[getJsLoader(options), ...getCssLoaders(options), ...getAssetsLoaders(options)],
                ],
            },
            plugins: [
                ...config.plugins,
                new MiniCssExtractPlugin({
                    filename: isProduction ? '[name].[contenthash:8].css' : '[name].css',
                    chunkFilename: isProduction ? '[id].[contenthash:8].css' : '[id].css',
                }),
            ],
            node: {
                ...config.node,
                __dirname: true,
                __filename: true,
            },
        };
    },
};
