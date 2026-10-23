// Sandboxed library name -> emitted filename. This module only exists when the app's
// webpack config has `SandboxedLibrariesPlugin` (./webpack), so a missing plugin
// fails the build. In production the filenames carry a content hash, which is
// what stops a deploy leaving a stale sandboxed library in someone's browser cache.
import sandboxedManifest from 'proton-sandboxed-libraries';

import { type CreateSandboxOptions, type SandboxRemote, createSandbox } from './host';
import type { SandboxedApi } from './protocol';

/**
 * Falls back to the plain convention for a sandboxed library missing from the manifest:
 * dev-server sessions where a sandboxed library was added after the config was read.
 * Nothing is cached there anyway.
 */
export function resolveSandboxedFilename(name: string): string {
    return sandboxedManifest[name] ?? `${name}.sandboxed.js`;
}

interface SandboxedLibraryOptions {
    /** Files the sandboxed code reads with `getAsset()`, name -> URL. Only our own `/assets/` is allowed. */
    assets?: Record<string, string>;
}

/** Asset bytes are fetched with our page's cookies, so they must come from our own build output. */
function assertOwnAssets(assets: Record<string, string>): void {
    Object.entries(assets).forEach(([name, url]) => {
        const resolved = new URL(url, window.location.href);
        if (resolved.origin !== window.location.origin || !resolved.pathname.startsWith('/assets/')) {
            throw new Error(`Sandbox asset "${name}" must be served from our own /assets/, got "${url}"`);
        }
    });
}

export function sandboxedLibraryOptions(name: string, { assets }: SandboxedLibraryOptions = {}): CreateSandboxOptions {
    if (assets) {
        assertOwnAssets(assets);
    }
    return {
        name,
        sandboxed: { kind: 'script', url: `${window.location.origin}/assets/${resolveSandboxedFilename(name)}` },
        csp: { connectSrc: "'none'" },
        assets,
    };
}

/**
 * The way you should normally create a sandbox in Drive.
 *
 * `createSandbox` is deliberately flexible; this wrapper picks the one set of
 * answers we want everywhere, so nobody re-decides security per feature: load
 * the sandboxed code from our own `/assets/`, and no network inside the box.
 *
 * `name` is the thread that ties it all together — it must match the sandboxed file
 * `<name>.sandboxed.ts`. See README.md.
 */
export function createSandboxedLibrary<T extends SandboxedApi>(
    name: string,
    options?: SandboxedLibraryOptions
): SandboxRemote<T> {
    return createSandbox<T>(sandboxedLibraryOptions(name, options));
}
