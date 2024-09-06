/* eslint-disable no-console */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

/** This webpack plugin optimizes SVG icons injected by `Icons.tsx`.
 * It ensures only icons used in the final application are included in the build.
 * - Works on the raw output after optimizations
 * - Suitable only for unchunked builds without dynamic imports
 * - May not work as expected with code splitting or asynchronous file loading
 * - Analyzes assets in their final form */
class ProtonIconsTreeShakePlugin {
    /**
     * @param {Object} options - Plugin configuration
     * @param {string[]} [options.entries=[]] - Array of entry filenames to process
     * @param {boolean} [options.excludeMimeIcons=false] - If true, always exclude mime icons
     */
    constructor(options) {
        this.entries = options.entries ?? [];
        this.excludeMimeIcons = options.excludeMimeIcons ?? false;
        this.spriteIcons = this.getIconNames('icons/assets/sprite-icons.svg');
        this.mimeIcons = this.getIconNames('styles/assets/img/icons/file-icons.svg');
    }

    /**
     * Extracts icon names from definitions from an SVG file
     * @param {string} pathname Relative path to the SVG file
     * @returns {string[]} Array of icon names
     */
    getIconNames(pathname) {
        try {
            const packages = path.resolve(__dirname, '../../../..');
            const svgPath = path.resolve(packages, pathname);
            const svg = fs.readFileSync(svgPath, 'utf8');
            const nodes = Array.from(new JSDOM(svg).window.document.querySelectorAll('g[id]'));
            return nodes.map((node) => node.id.replace(/(ic|mime-(sm|md|lg))-/, ''));
        } catch {
            console.warn(`Failed to read SVG file: ${pathname}`);
            return [];
        }
    }

    /**
     * Removes unused icon definitions from the content
     * @param {string} content File content
     * @param {Set<string>} unused Set of unused icon names
     * @returns {string} Updated content with unused icons removed
     */
    removeUnusedIcons(content, unused) {
        unused.forEach((icon) => {
            const regex = new RegExp(`<g id="(ic|mime-(sm|md|lg))-${icon}[\\s\\S]*?<\/g>`, 'g');
            content = content.replace(regex, '');
        });
        return content;
    }

    /**
     * Optimizes SVG content by removing newlines and extra whitespace
     * This can save around 10kb for Icons.tsx alone
     * @param {string} content File content
     * @returns {string} Optimized content
     */
    optimizeSVG(content) {
        return content.replace(/<svg[\s\S]*?<\/svg>/g, (match) =>
            match
                .split('\n')
                .map((line) => line.trim())
                .join(' ')
        );
    }

    /**
     * Processes a single file to remove unused icons and optimize SVG content
     * @param {webpack.Compilation} compilation Webpack compilation object
     * @param {Object} assets Compilation assets
     * @param {string} filename Name of the file to process
     */
    processFile(compilation, assets, filename) {
        let content = assets[filename].source();
        const originalLength = content.length;
        const unused = new Set([...this.mimeIcons, ...this.spriteIcons]);

        /* Identify used icons (may have false positives) via direct string match */
        unused.forEach((icon) => content.includes(`"${icon}"`) && unused.delete(icon));
        if (this.excludeMimeIcons) this.mimeIcons.forEach((icon) => unused.add(icon));

        console.info(`[ProtonIconsTreeShake] Found ${unused.size} unused icons in ${filename}`);

        if (unused.size > 0) {
            content = this.removeUnusedIcons(content, unused);
            content = this.optimizeSVG(content);

            if (content.length !== originalLength) {
                compilation.updateAsset(filename, new webpack.sources.RawSource(content));
                const savedChars = originalLength - content.length;
                const savedKB = (savedChars / 1024).toFixed(2);
                console.info(`[ProtonIconsTreeShake] Reduced ${filename} size by ${savedKB}KB`);
            }
        }
    }

    /**
     * Plugin is applied after assets have been optimized and tree-shaken.
     * @param {webpack.Compiler} compiler Webpack compiler instance
     */
    apply(compiler) {
        compiler.hooks.compilation.tap('ProtonIconsTreeShakePlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'ProtonIconsTreeShakePlugin',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 1,
                },
                (assets) => {
                    Object.keys(assets).forEach((filename) => {
                        if (this.entries.some((entry) => filename.endsWith(`${entry}.js`))) {
                            this.processFile(compilation, assets, filename);
                        }
                    });
                }
            );
        });
    }
}

module.exports = ProtonIconsTreeShakePlugin;
