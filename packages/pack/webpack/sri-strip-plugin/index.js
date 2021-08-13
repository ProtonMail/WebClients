const HtmlWebpackPlugin = require('html-webpack-plugin');

class SriStripPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        // afterPlugins and thisCompilation for compatibility with the SRI plugin so that it's run after it
        compiler.hooks.afterPlugins.tap('SriStripPlugin', (compiler) => {
            compiler.hooks.thisCompilation.tap({ name: 'SriStripPlugin', stage: -1000 }, (compilation) => {
                HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
                    {
                        name: 'SriStripPlugin',
                        stage: 10000,
                    },
                    async (data) => {
                        data.headTags.concat(data.bodyTags).forEach((tag) => {
                            const src = tag.attributes.href || tag.attributes.src;
                            if (!this.options.ignore || !this.options.ignore.test(src)) {
                                return;
                            }
                            if (tag.attributes.integrity || tag.attributes.crossorigin) {
                                delete tag.attributes.integrity;
                                delete tag.attributes.crossorigin;
                            }
                        });
                        return data;
                    }
                );
            });
        });
    }
}

module.exports = SriStripPlugin;
