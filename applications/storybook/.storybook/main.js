const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getJsLoader } = require('@proton/pack/webpack/js.loader');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');
const getOptimization = require('@proton/pack/webpack/optimization');

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
    addons: ['@storybook/addon-essentials', '@storybook/addon-links', '@storybook/addon-storysource'],
    core: {
        disableTelemetry: true,
    },
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    staticDirs: ['../src/assets', '../src/assets/favicons'],
    stories: [
        '../src/stories/components/*.stories.@(mdx|js|jsx|ts|tsx)',
        // TODO: remove the commented out stories once we have a proper way to handle mdx files in storybook
        // '../src/stories/coreConcepts/*.stories.@(mdx|js|jsx|ts|tsx)',
        // '../src/stories/cssUtilities/*.stories.@(mdx|js|jsx|ts|tsx)',
        '../../../packages/atoms/**/*.stories.@(js|jsx|ts|tsx)',
    ],
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
            inlineIcons: true,
        };

        const optimization = getOptimization(options);

        return {
            ...config,
            experiments: { ...config.experiments, asyncWebAssembly: true },
            module: {
                ...config.module,
                rules: [
                    // Filter out JS/CSS loaders that are not related to MDX to prevent Webpack from blowing up due to conflicting rules
                    ...config.module.rules.filter((rule) => {
                        return rule && rule.test && rule.test.toString().includes('mdx');
                    }),
                    {
                        test: /\.stories\.(mdx|tsx)?$/,
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
            node: {
                ...config.node,
                __dirname: true,
                __filename: true,
            },
            optimization: {
                ...config.optimization,
                minimizer: optimization.minimizer,
            },
            plugins: [
                ...config.plugins,
                new MiniCssExtractPlugin({
                    filename: isProduction ? '[name].[contenthash:8].css' : '[name].css',
                    chunkFilename: isProduction ? '[id].[contenthash:8].css' : '[id].css',
                }),
            ],
            resolve: {
                ...config.resolve,
                fallback: {
                    ...config.resolve.fallback,
                    // For some reason storybook brings in openpgp as a dependency and we need to
                    // explicitly disable these in the webpack config
                    crypto: false,
                    iconv: false,
                    stream: false,
                },
            },
        };
    },
};
