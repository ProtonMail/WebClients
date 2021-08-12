const webpack = require('webpack');

function WriteWebpackPlugin(files) {
    function apply(compiler) {
        compiler.hooks.thisCompilation.tap('WriteWebpackPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'WriteWebpackPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    for (const file of files) {
                        compilation.emitAsset(file.name, new webpack.sources.RawSource(file.data));
                    }
                }
            );
        });
    }

    return { apply };
}

module.exports = WriteWebpackPlugin;
