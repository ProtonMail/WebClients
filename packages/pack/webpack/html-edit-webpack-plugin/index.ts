import HtmlWebpackPlugin, { HtmlTagObject } from 'html-webpack-plugin';
import { Compiler } from 'webpack';

export default class HtmlEditWebpackPlugin {
    constructor(private handle: (node: HtmlTagObject) => HtmlTagObject) {}

    apply(compiler: Compiler) {
        // afterPlugins and thisCompilation for compatibility with the SRI plugin so that it's run after it
        compiler.hooks.afterPlugins.tap('HtmlEditWebpackPlugin', (compiler) => {
            compiler.hooks.thisCompilation.tap(
                {
                    name: 'HtmlEditWebpackPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
                },
                (compilation) => {
                    HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
                        {
                            name: 'HtmlEditWebpackPlugin',
                            stage: 10000,
                        },
                        async (data) => {
                            data.headTags = data.headTags.map(this.handle).filter((tag) => !!tag);
                            data.bodyTags = data.bodyTags.map(this.handle).filter((tag) => !!tag);
                            return data;
                        }
                    );
                }
            );
        });
    }
}
