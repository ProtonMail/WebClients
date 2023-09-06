import { Compiler, sources } from 'webpack';

interface File {
    name: string;
    data: string;
}

export default class CopyIndexHtmlWebpackPlugin {
    constructor(private handle: (source: string) => File[]) {}

    apply(compiler: Compiler) {
        compiler.hooks.thisCompilation.tap('CopyIndexHtmlWebpackPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'CopyIndexHtmlWebpackPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                    additionalAssets: true,
                },
                (assets) => {
                    const targetFilename = 'index.html';
                    const [assetName, source] = Object.entries(assets).find(([key]) => key === targetFilename) || [];
                    if (!assetName || !source) {
                        return;
                    }
                    const files = this.handle(source.source().toString());
                    files.forEach((file) => {
                        if (file.name === targetFilename) {
                            compilation.updateAsset(file.name, new sources.RawSource(file.data));
                        } else {
                            compilation.emitAsset(file.name, new sources.RawSource(file.data));
                        }
                    });
                }
            );
        });
    }
}
