const { dirname, join } = require('node:path');

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, 'package.json')));
}

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getJsLoader } = require('@proton/pack/webpack/js.loader.swc');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
    addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],
    core: {
        disableTelemetry: true,
    },
    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },
    staticDirs: ['../src/assets', '../src/assets/favicons'],
    // Storybook v9: use *.stories.(js|ts|tsx) for CSF and *.mdx for standalone docs (no .stories.mdx indexer)
    stories: [
        '../src/stories/atoms/*.stories.@(js|jsx|ts|tsx)',
        '../src/stories/components/*.stories.@(js|jsx|ts|tsx)',
        '../src/stories/coreConcepts/*.stories.@(js|jsx|ts|tsx)',
        '../src/stories/coreConcepts/LayersManagement.mdx',
        '../src/stories/coreConcepts/Responsive.mdx',
        '../src/stories/coreConcepts/SassCssVariables.mdx',
        // '../src/stories/cssUtilities/*.stories.@(mdx|js|jsx|ts|tsx)',
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
                // Use Storybook's default minimizer so mocker-runtime-injected.js (ESM) is minified correctly
                minimizer: config.optimization.minimizer,
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
