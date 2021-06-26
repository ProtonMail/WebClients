const HtmlWebpackPlugin = require('html-webpack-plugin');

class SriStripPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        // afterPlugins and thisCompilation for compatibility with the SRI plugin so that it's run after it
        compiler.hooks.afterPlugins.tap('SriStripPlugin', (compiler) => {
            compiler.hooks.thisCompilation.tap('SriStripPlugin', () => {
                compiler.hooks.compilation.tap('SriStripPlugin', (compilation) => {
                    HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('sri', (data, callback) => {
                        data.assetTags.styles.forEach((tag) => {
                            const src = tag.attributes.href || tag.attributes.src;
                            if (!this.options.ignore || !this.options.ignore.test(src)) {
                                return;
                            }
                            if (tag.attributes.integrity || tag.attributes.crossorigin) {
                                delete tag.attributes.integrity;
                                delete tag.attributes.crossorigin;
                            }
                        });
                        callback(null, data);
                    });
                });
            });
        });
    }
}

module.exports = SriStripPlugin;
