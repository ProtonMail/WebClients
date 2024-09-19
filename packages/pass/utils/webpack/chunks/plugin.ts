import type { Compiler, WebpackPluginInstance } from 'webpack';
import webpack from 'webpack';

/**
 * By default, when using deterministic chunk IDs, we lose the `chunk.name`
 * information that is available when running with named chunk IDs. This plugin
 * preserves named `chunkIds` which can be crucial for identifying assets
 * in later stages of the build process (i.e., when computing manifests). It
 * ensures chunk IDs are deterministic for consistent builds while retaining the
 * named chunk information. It essentially combines the `NamedChunkIdsPlugin` and
 * `DeterministicChunkIdsPlugin`, which cannot work together by default.
 *
 * Note: This plugin is designed for production builds only and should not be used
 * in watch mode or with webpack-dev-server, as it may cause issues with hot reloading.
 */
export class NamedDeterministicChunkIdsPlugin implements WebpackPluginInstance {
    apply(compiler: Compiler) {
        const mode = compiler.options.mode;
        const isWatch = compiler.options.watch;

        if (mode === 'production' && !isWatch) {
            new webpack.ids.NamedChunkIdsPlugin().apply(compiler);

            compiler.hooks.compilation.tap('NamedDeterministicChunkIdsPlugin', (compilation) => {
                compilation.hooks.chunkIds.tap('NamedDeterministicChunkIdsPlugin', (chunks) => {
                    Array.from(chunks).forEach((chunk) => {
                        if (chunk.id !== null) {
                            chunk.name = String(chunk.id);
                            chunk.id = null;
                        }
                    });
                });
            });

            new webpack.ids.DeterministicChunkIdsPlugin().apply(compiler);
        }
    }
}
