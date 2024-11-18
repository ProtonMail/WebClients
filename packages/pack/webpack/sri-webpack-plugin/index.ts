import { createHash } from 'crypto';
import webpack, { type Compiler } from 'webpack';

export default class SriWebpackPlugin {
    apply(compiler: Compiler) {
        const pluginName = 'SriWebpackPlugin';
        const sriGeneratePattern = '__sri_generate__:';
        const regex = new RegExp(`${sriGeneratePattern}([^'"]+)`, 'g');

        const createSri = (source: Buffer | string, hashFuncName = 'sha384') => {
            const hash = createHash(hashFuncName)
                .update(typeof source === 'string' ? Buffer.from(source, 'utf-8') : source)
                .digest('base64');
            return `${hashFuncName}-${hash}`;
        };

        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: pluginName,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
                },
                (assets) => {
                    const toUpdate: {
                        [pattern: string]: { filename: string; valueToReplace: string }[];
                    } = {};
                    const assetKeys = Object.keys(assets);
                    assetKeys.forEach((filename) => {
                        if (!filename.includes('.js')) {
                            return;
                        }
                        const asset = compilation.getAsset(filename);
                        const source = asset.source.source().toString();
                        const matches = source.matchAll(regex);
                        for (const match of matches) {
                            const pattern = match[1];
                            if (!toUpdate[pattern]) {
                                toUpdate[pattern] = [];
                            }
                            toUpdate[pattern].push({ filename, valueToReplace: match[0] });
                        }
                    });
                    Object.keys(toUpdate).forEach((pattern) => {
                        const assetKeyRegex = new RegExp(pattern);
                        const assetKey = assetKeys.find((assetKey) => assetKeyRegex.test(assetKey));
                        if (!assetKey) {
                            throw new Error(`Failed to find asset from pattern ${pattern}`);
                        }
                        const targetAsset = compilation.getAsset(assetKey);
                        const sri = createSri(targetAsset.source.source());
                        toUpdate[pattern].forEach(({ filename, valueToReplace }) => {
                            const selfAsset = compilation.getAsset(filename);
                            const { source, map } = selfAsset.source.sourceAndMap();
                            const newSourceString = source.toString().replace(valueToReplace, sri);
                            const newSourceMapSource = new webpack.sources.SourceMapSource(
                                newSourceString,
                                filename,
                                map,
                                source,
                                map,
                                true
                            );
                            compilation.updateAsset(filename, newSourceMapSource);
                        });
                    });
                }
            );
        });
    }
}
