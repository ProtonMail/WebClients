import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader.swc';

const require = createRequire(import.meta.url);

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, 'package.json')));
}

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
    core: {
        disableTelemetry: true,
    },
    stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    staticDirs: [],
    addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],
    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },
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
            resolve: {
                ...config.resolve,
                fallback: {
                    ...config.resolve?.fallback,
                    stream: false,
                },
            },
            experiments: {
                asyncWebAssembly: true,
            },
            module: {
                ...config.module,
                rules: [
                    ...config.module.rules.filter((rule) => {
                        return Boolean(!rule.use?.[0]?.includes?.('style-loader'));
                    }),
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
        };
    },
};

export default config;
