/**
 * Lumo-specific webpack optimization configuration
 *
 * This configuration enhances the base optimization with Lumo-specific chunk splitting
 * to ensure heavy markdown/syntax highlighting libraries are lazy-loaded.
 */

const getOptimizations = require('@proton/pack/webpack/optimization');

module.exports = (webpackOptions) => {
    const baseOptimization = getOptimizations(webpackOptions);

    return {
        ...baseOptimization,
        splitChunks: {
            ...baseOptimization.splitChunks,
            cacheGroups: {
                ...baseOptimization.splitChunks.cacheGroups,

                // Markdown rendering stack - lazy loaded
                // These are heavy packages only needed when rendering message content
                markdown: {
                    test: /[\\/]node_modules[\\/](react-markdown|remark-gfm|remark-math|rehype-katex|katex)[\\/]/,
                    name: 'markdown-renderer',
                    chunks: 'async', // Only include in async chunks (lazy loaded)
                    priority: 20,
                    enforce: true,
                },

                // Syntax highlighter - lazy loaded
                // react-syntax-highlighter is large (~500KB) and only needed for code blocks
                syntaxHighlighter: {
                    test: /[\\/]node_modules[\\/](react-syntax-highlighter|refractor|prismjs)[\\/]/,
                    name: 'syntax-highlighter',
                    chunks: 'async', // Only include in async chunks (lazy loaded)
                    priority: 20,
                    enforce: true,
                },

                // Keep existing timezone support chunk
                tz: baseOptimization.splitChunks.cacheGroups.tz,

                // Default vendors - but ensure markdown packages don't end up here
                defaultVendors: {
                    ...baseOptimization.splitChunks.cacheGroups.defaultVendors,
                    test: (module) => {
                        // Exclude markdown/syntax highlighter packages from default vendors
                        if (!module.resource) return false;

                        const isNodeModule = /[\\/]node_modules[\\/]/.test(module.resource);
                        if (!isNodeModule) return false;

                        // Exclude markdown rendering packages
                        const isMarkdownPackage =
                            /[\\/](react-markdown|remark-gfm|remark-math|rehype-katex|katex|react-syntax-highlighter|refractor|prismjs)[\\/]/.test(
                                module.resource
                            );

                        return !isMarkdownPackage;
                    },
                },
            },
        },
    };
};
