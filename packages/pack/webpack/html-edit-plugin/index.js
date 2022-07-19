class HtmlEditPlugin {
    constructor(handle, plugin) {
        this.handle = handle;
        this.HtmlWebpackPlugin = plugin;
    }

    apply(compiler) {
        // afterPlugins and thisCompilation for compatibility with the SRI plugin so that it's run after it
        compiler.hooks.afterPlugins.tap('HtmlEditPlugin', (compiler) => {
            compiler.hooks.thisCompilation.tap({ name: 'HtmlEditPlugin', stage: -1000 }, (compilation) => {
                this.HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
                    {
                        name: 'HtmlEditPlugin',
                        stage: 10000,
                    },
                    async (data) => {
                        data.headTags = data.headTags.map(this.handle).filter((tag) => !!tag);
                        data.bodyTags = data.bodyTags.map(this.handle).filter((tag) => !!tag);
                        return data;
                    }
                );
            });
        });
    }
}

module.exports = HtmlEditPlugin;
