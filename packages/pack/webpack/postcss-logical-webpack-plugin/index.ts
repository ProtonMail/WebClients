import postcss from 'postcss';
import logical from 'postcss-logical';
import type { Compiler } from 'webpack';
import { sources } from 'webpack';

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
                                /*
                                 * URL Origin Detection Technique:
                                 *
                                 * We use a dummy origin to detect whether a CSS file path is relative or absolute.
                                 * When we construct new URL(path, targetOrigin):
                                 *
                                 * - If `path` is relative (e.g., "styles/main.css"):
                                 *   → Results in "https://same-origin-test.com/styles/main.css"
                                 *   → url.origin === targetOrigin (same origin) ✅
                                 *
                                 * - If `path` is absolute (e.g., "https://cdn.example.com/external.css"):
                                 *   → Results in "https://cdn.example.com/external.css" (base URL ignored)
                                 *   → url.origin !== targetOrigin (different origin) ❌
                                 *
                                 * This approach is more robust than simple string checking and handles
                                 * edge cases properly using the browser's URL parsing logic.
                                 */
                                const targetOrigin = `https://same-origin-test.com`;
                                const url = new URL(path, targetOrigin);
                                const isRelativePath = url.origin === targetOrigin;

                                return (
                                    isRelativePath &&
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
