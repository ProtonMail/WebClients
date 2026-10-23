import browserslist from 'browserslist';
import { type BuildOptions, type BuildResult, build, buildSync } from 'esbuild';
import { createHash } from 'node:crypto';
import { globSync } from 'node:fs';
import path from 'node:path';

interface SandboxedBundle {
    /** The name a consumer passes to `createSandboxedLibrary`, e.g. `videoAnalyzer`. */
    name: string;
    /** Output filename, e.g. `videoAnalyzer.sandboxed.js` or `videoAnalyzer.sandboxed.1a2b3c4d.js`. */
    filename: string;
    /** Minified, self-contained IIFE source. */
    code: string;
}

export interface BuildSandboxedOptions {
    /** Package root scanned for sandboxed entrypoints. */
    cwd: string;
    /**
     * Put a content hash in each filename. On for production builds so a deploy
     * can never leave a stale sandboxed library in a browser cache; off in watch mode, where
     * every edit would change the filename and the app's compile-time manifest
     * would immediately be wrong.
     */
    hash?: boolean;
}

export interface BuildSandboxedResult {
    bundles: SandboxedBundle[];
    /** `name -> filename`, for the app to resolve a sandboxed URL at runtime. */
    manifest: Record<string, string>;
    /** Absolute paths of every non-`node_modules` source that fed the bundles, for watch wiring. */
    inputs: string[];
}

export const SANDBOXED_PATTERN = 'modules/**/*.sandboxed.ts';

/** browserslist name -> esbuild engine. The other production browsers are Chromium-based, so the Chrome floor covers them. */
const ESBUILD_ENGINES: Record<string, string> = {
    chrome: 'chrome',
    edge: 'edge',
    firefox: 'firefox',
    safari: 'safari',
    ios_saf: 'ios',
};

export const productionTargets = (): string[] => {
    const lowest = new Map<string, number>();
    for (const entry of browserslist(undefined, { env: 'production', path: __dirname })) {
        const [name, version] = entry.split(' ');
        const engine = ESBUILD_ENGINES[name];
        // `parseFloat` reads `14.0-14.4` as 14.
        const major = parseFloat(version);
        if (engine && major < (lowest.get(engine) ?? Infinity)) {
            lowest.set(engine, major);
        }
    }
    return [...lowest].map(([engine, major]) => `${engine}${major}`);
};

const EMPTY: BuildSandboxedResult = { bundles: [], manifest: {}, inputs: [] };

/** `/some/where/foo.sandboxed.ts` -> `foo`. */
const sandboxedName = (file: string): string => path.basename(file).replace(/\.sandboxed\.(ts|js)$/, '');

/**
 * Output is keyed by basename, so two `foo.sandboxed.ts` in different folders would
 * both emit `foo.sandboxed.js` and one would silently win — leaving a feature
 * talking to the wrong sandboxed library. Fail the build instead.
 */
const assertNoDuplicateNames = (entryPoints: string[], root: string): void => {
    const byName = new Map<string, string[]>();
    for (const entry of entryPoints) {
        const name = sandboxedName(entry);
        byName.set(name, [...(byName.get(name) ?? []), entry]);
    }
    const collisions = [...byName.entries()].filter(([, entries]) => entries.length > 1);
    if (collisions.length > 0) {
        const detail = collisions
            .map(([name, entries]) => `${name}: ${entries.map((entry) => path.relative(root, entry)).join(', ')}`)
            .join('; ');
        throw new Error(`Duplicate sandboxed library names — each must be unique across the package. ${detail}`);
    }
};

const esbuildOptions = (entryPoints: string[], root: string): BuildOptions => ({
    entryPoints,
    absWorkingDir: root,
    bundle: true,
    format: 'iife',
    // Same browsers as the app, so a sandboxed library never fails to parse on a supported
    // browser. Runtime APIs (WebCodecs, …) are the sandboxed code's own check.
    target: productionTargets(),
    minify: true,
    write: false,
    metafile: true,
    logLevel: 'silent',
    // `outdir` + `entryNames` give each output a stable `<name>.sandboxed.js`
    // path even with `write: false` (esbuild would otherwise name a lone
    // entry `<stdout>`); nothing is written to disk.
    outdir: root,
    entryNames: '[name]',
});

const toResult = (
    result: BuildResult<BuildOptions & { write: false; metafile: true }>,
    root: string,
    hash: boolean
): BuildSandboxedResult => {
    const bundles = result.outputFiles.map((file) => {
        const name = sandboxedName(file.path);
        const digest = hash ? `${createHash('sha256').update(file.text).digest('hex').slice(0, 8)}.` : '';
        return { name, filename: `${name}.sandboxed.${digest}js`, code: file.text };
    });
    const manifest = Object.fromEntries(bundles.map(({ name, filename }) => [name, filename]));
    const inputs = Object.keys(result.metafile.inputs)
        .map((input) => path.resolve(root, input))
        .filter((input) => !input.includes('node_modules'));

    return { bundles, manifest, inputs };
};

const prepare = (cwd: string): { root: string; entryPoints: string[] } => {
    // esbuild's `absWorkingDir` must be absolute; normalize so callers may pass a relative root.
    const root = path.resolve(cwd);
    const entryPoints = globSync(SANDBOXED_PATTERN, { cwd: root }).map((entry) => path.resolve(root, entry));
    assertNoDuplicateNames(entryPoints, root);
    return { root, entryPoints };
};

/**
 * Turn every `*.sandboxed.ts` under `cwd` into one self-contained script.
 *
 * Self-contained because a sandboxed library runs in its own isolated world: it can't share
 * anything with the app bundle, so it carries its own copy of what it imports.
 * The upside is that the heavy parsing library lives only here, and users who
 * never trigger the feature never download it.
 */
export const buildSandboxed = async ({ cwd, hash = false }: BuildSandboxedOptions): Promise<BuildSandboxedResult> => {
    const { root, entryPoints } = prepare(cwd);
    if (entryPoints.length === 0) {
        return EMPTY;
    }
    return toResult(await build(esbuildOptions(entryPoints, root)), root, hash);
};

/**
 * Same thing, synchronously.
 *
 * Needed because the app has to know each sandboxed code's hashed filename at *compile*
 * time (it becomes a DefinePlugin constant), and webpack builds its config
 * synchronously — long before any compilation hook could report a hash back.
 * Sandboxed libraries don't depend on the app's module graph, so building them this early is
 * sound; it costs one esbuild pass over a handful of small files.
 */
export const buildSandboxedSync = ({ cwd, hash = false }: BuildSandboxedOptions): BuildSandboxedResult => {
    const { root, entryPoints } = prepare(cwd);
    if (entryPoints.length === 0) {
        return EMPTY;
    }
    return toResult(buildSync(esbuildOptions(entryPoints, root)), root, hash);
};
