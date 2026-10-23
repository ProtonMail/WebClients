import path from 'node:path';
import type { Compiler } from 'webpack';

import { type BuildSandboxedResult, SANDBOXED_PATTERN, buildSandboxed, buildSandboxedSync } from './buildSandboxed';

const PLUGIN = 'SandboxedLibrariesPlugin';

/** Root of `@proton/drive`, where the sandboxed glob is resolved. */
const PACKAGE_ROOT = path.resolve(__dirname, '../../..');

const OUT_DIR = 'assets';

const MANIFEST_MODULE = 'proton-sandboxed-libraries';

export interface SandboxedLibrariesPluginOptions {
    /**
     * Put a content hash in each filename. On for production, so a deploy can
     * never leave a stale sandboxed library in a browser cache; off in dev, where the
     * filename has to stay stable for watch rebuilds to keep matching the
     * manifest.
     */
    hash?: boolean;
}

/**
 * Builds every `*.sandboxed.ts` in `@proton/drive` and drops the results into the
 * app's build output as `assets/<name>.sandboxed[.<hash>].js`, plus the
 * `proton-sandboxed-libraries` manifest module that `createSandboxedLibrary` imports to turn a
 * sandboxed name into a filename.
 *
 * Sandboxed libraries can't be ordinary webpack entries: each one is its own isolated world
 * and the app only ever imports its *type*, so webpack never sees it and would
 * happily build an app whose sandboxed bundles don't exist. This plugin bundles them
 * alongside (with esbuild) so there's no prebuild step and nothing generated in
 * the source tree.
 *
 * An app that uses Drive sandboxes adds this plugin to its webpack config.
 */
export class SandboxedLibrariesPlugin {
    private readonly hash: boolean;

    /**
     * Built synchronously here, not during the compilation: the manifest becomes
     * a compile-time constant, so the hashes must exist before webpack starts.
     * Reused for the first compilation so production doesn't build twice; watch
     * rebuilds ignore it and build fresh.
     */
    private prebuilt: BuildSandboxedResult | undefined;

    private readonly manifest: Record<string, string>;

    private inputs: string[] = [];

    constructor({ hash = false }: SandboxedLibrariesPluginOptions = {}) {
        this.hash = hash;
        this.prebuilt = buildSandboxedSync({ cwd: PACKAGE_ROOT, hash });
        this.manifest = this.prebuilt.manifest;
    }

    apply(compiler: Compiler) {
        // `createSandboxedLibrary` imports the manifest from this module. Only this
        // plugin provides it, so an app that forgets the plugin fails to build.
        const manifestModule = `data:text/javascript,${encodeURIComponent(`export default ${JSON.stringify(this.manifest)};`)}`;
        new compiler.webpack.NormalModuleReplacementPlugin(new RegExp(`^${MANIFEST_MODULE}$`), (resource) => {
            resource.request = manifestModule;
        }).apply(compiler);

        compiler.hooks.thisCompilation.tap(PLUGIN, (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                { name: PLUGIN, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                async () => {
                    // Take the config-time build if we still have it, then drop
                    // it so watch rebuilds pick up edits.
                    const built = this.prebuilt ?? (await buildSandboxed({ cwd: PACKAGE_ROOT, hash: this.hash }));
                    this.prebuilt = undefined;
                    this.inputs = built.inputs;

                    for (const { filename, code } of built.bundles) {
                        const asset = `${OUT_DIR}/${filename}`;
                        const source = new compiler.webpack.sources.RawSource(code);
                        if (compilation.getAsset(asset)) {
                            compilation.updateAsset(asset, source);
                        } else {
                            compilation.emitAsset(asset, source);
                        }
                    }
                }
            );
        });

        // Webpack only watches files it knows about, and it doesn't know about
        // sandboxed libraries. Tell it about every source that fed the bundles (so editing a
        // sandboxed library rebuilds) plus the directory itself (so adding a new sandboxed library does
        // too) — otherwise dev mode silently serves stale sandboxed code.
        compiler.hooks.afterCompile.tap(PLUGIN, (compilation) => {
            for (const input of this.inputs) {
                compilation.fileDependencies.add(input);
            }
            compilation.contextDependencies.add(path.resolve(PACKAGE_ROOT, SANDBOXED_PATTERN.split('/')[0]));
        });
    }
}
