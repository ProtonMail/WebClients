import { Compiler, sources } from 'webpack';

interface File {
    name: string;
    data: string | Buffer;
}

export default class WriteWebpackPlugin {
    constructor(private files: File[]) {}

    apply(compiler: Compiler) {
        compiler.hooks.thisCompilation.tap('WriteWebpackPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'WriteWebpackPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    for (const file of this.files) {
                        compilation.emitAsset(file.name, new sources.RawSource(file.data));
                    }
                }
            );
        });
    }
}
