const webpack = require('webpack');
const postcss = require('postcss');

function PostCssLogicalWebpackPlugin() {
    function apply(compiler) {
        compiler.hooks.thisCompilation.tap('PostCssLogicalPlugin', (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: 'PostCssLogicalPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                async (assets) => {
                    const processor = postcss([require('postcss-logical')()]);
                    return Promise.all(
                        Object.entries(assets)
                            .filter(([path]) => path.endsWith('.css'))
                            .map(async ([pathname, asset]) => {
                                const result = await processor.process(asset.source(), {
                                    map: false,
                                    from: undefined,
                                    to: undefined,
                                });
                                compilation.emitAsset(
                                    `${pathname.replace(/\.css$/, '.ltr.css')}`,
                                    new webpack.sources.RawSource(result.css)
                                );
                            })
                    );
                }
            );
        });
    }

    return { apply };
}

module.exports = PostCssLogicalWebpackPlugin;
