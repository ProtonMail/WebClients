import logical from 'postcss-logical';
import { Compiler, sources } from 'webpack';

import postcss from 'postcss';

export default class PostCssLogicalWebpackPlugin {
    apply(compiler: Compiler) {
        const processor = postcss([logical()]);

        compiler.hooks.thisCompilation.tap('PostCssLogicalWebpackPlugin', (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: 'PostCssLogicalWebpackPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                    additionalAssets: true,
                },
                async (assets) => {
                    await Promise.all(
                        Object.entries(assets)
                            .filter(([path]) => {
                                const targetOrigin = 'https://proton.local';
                                const url = new URL(path, targetOrigin);
                                return (
                                    url.origin === targetOrigin &&
                                    url.pathname.endsWith('.css') &&
                                    !url.pathname.endsWith('.ltr.css')
                                );
                            })
                            .map(async ([path, asset]) => {
                                const result = await processor.process(asset.source(), {
                                    map: false,
                                    from: undefined,
                                    to: undefined,
                                });
                                const filename = `${path.replace(/\.css/, '.ltr.css')}`;
                                const source = new sources.RawSource(result.css);
                                if (compilation.getAsset(filename)) {
                                    compilation.updateAsset(filename, source);
                                } else {
                                    compilation.emitAsset(filename, source);
                                }
                            })
                    );
                    return undefined;
                }
            );
        });
    }
}
