import { createRequire } from 'node:module';
import TerserPlugin from 'terser-webpack-plugin';

const require = createRequire(import.meta.url);
const { getJsLoader } = require('@proton/pack/webpack/js.loader.swc');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function addCatalogInteractionStates(cssLoaders) {
    const postcssOptions = cssLoaders.flatMap(({ use }) => use).find((loader) => loader.options?.postcssOptions)
        ?.options.postcssOptions;
    if (!Array.isArray(postcssOptions?.plugins)) {
        throw new Error('lumo-ui-storybook: expected @proton/pack CSS loaders with a postcssOptions.plugins array');
    }

    // The Sass loaders share these options. Show the component's real pseudo-state styles in the catalog.
    // Outside a [data-preview-state] cell the rewritten selector matches exactly as before.
    postcssOptions.plugins.push({
        postcssPlugin: 'lumo-catalog-interaction-states',
        Once(root) {
            root.walkRules((rule) => {
                rule.selector = rule.selector.replace(
                    // Negations are rewritten too: a preview cell behaves as if it really is in that state,
                    // so :focus:not(:focus-visible) resets don't remove the focus ring.
                    /:(hover|active|focus-visible|focus-within|focus)(?![\w-])/g,
                    (pseudo, state) => {
                        const states =
                            state === 'hover' ? ['hover', 'pressed'] : [state === 'active' ? 'pressed' : 'focus'];
                        const target =
                            state.startsWith('focus') && state !== 'focus-within'
                                ? ' :is(input, textarea, select, button, a[href], [tabindex])'
                                : ' *';
                        // For tab sets, simulate focus on the selected tab only.
                        const exclude = state.startsWith('focus')
                            ? ':not([data-preview-ignore-focus], [data-preview-ignore-focus] *, [role="tab"][aria-selected="false"])'
                            : '';
                        const selectors = states.map((value) => `[data-preview-state="${value}"]${target}${exclude}`);
                        return `:is(${pseudo}, :where(${selectors.join(', ')}))`;
                    }
                );
            });
        },
    });
}

/** @type {import('@storybook/react-webpack5').StorybookConfig} */
export default {
    framework: '@storybook/react-webpack5',
    addons: ['@storybook/addon-docs'],
    stories: ['../stories/**/*.mdx'],
    core: { disableTelemetry: true },
    features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
    typescript: { reactDocgen: false },
    webpackFinal: async (config, { configType }) => {
        const options = { isProduction: configType === 'PRODUCTION', hasReactRefresh: false };
        const cssLoaders = getCssLoaders(options);
        addCatalogInteractionStates(cssLoaders);

        return {
            ...config,
            experiments: { ...config.experiments, asyncWebAssembly: true },
            module: {
                ...config.module,
                rules: [
                    { test: /\.m?js$/, resolve: { fullySpecified: false } },
                    ...config.module.rules.filter((rule) => rule?.test?.toString().includes('mdx')),
                    getJsLoader(options),
                    ...cssLoaders,
                    ...getAssetsLoaders(),
                ],
            },
            optimization: { ...config.optimization, minimizer: [new TerserPlugin({ parallel: 1 })] },
            plugins: [...config.plugins, new MiniCssExtractPlugin()],
            resolve: {
                ...config.resolve,
                fallback: { ...config.resolve.fallback, crypto: false, iconv: false, stream: false },
            },
        };
    },
};
