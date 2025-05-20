import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader';

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
    core: {
        disableTelemetry: true,
    },
    stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    staticDirs: [],
    addons: ['@storybook/addon-webpack5-compiler-babel', '@storybook/addon-links', '@storybook/addon-essentials'],
    framework: '@storybook/react-webpack5',
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

        return {
            ...config,
            experiments: {
                asyncWebAssembly: true,
            },
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
                    // Filter out JS/CSS loaders that are not related to MDX to prevent Webpack from blowing up due to conflicting rules
                    ...config.module.rules.filter((rule) => {
                        return rule && rule.test && rule.test.toString().includes('mdx');
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
                    ...getJsLoaders(options),
                    ...getCssLoaders(options),
                    ...getAssetsLoaders(options),
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

export default config;
