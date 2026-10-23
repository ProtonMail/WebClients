import sandboxedManifest from 'proton-sandboxed-libraries';

import { resolveSandboxedFilename, sandboxedLibraryOptions } from './createSandboxedLibrary';
import { createSandboxIframe } from './host';

describe('resolveSandboxedFilename', () => {
    afterEach(() => {
        delete sandboxedManifest.foo;
    });

    it('falls back to the plain convention for a sandboxed library missing from the manifest', () => {
        // A dev-server session where the sandboxed code was added after the config was
        // read. Nothing is cached there, so an unhashed name is fine.
        expect(resolveSandboxedFilename('foo')).toBe('foo.sandboxed.js');
    });

    it('prefers the build manifest, so production gets the content-hashed file', () => {
        sandboxedManifest.foo = 'foo.sandboxed.1a2b3c4d.js';

        expect(resolveSandboxedFilename('foo')).toBe('foo.sandboxed.1a2b3c4d.js');
        expect(resolveSandboxedFilename('unlisted')).toBe('unlisted.sandboxed.js');
    });
});

describe('sandboxedLibraryOptions', () => {
    afterEach(() => {
        delete sandboxedManifest.foo;
    });

    it('loads the sandboxed code from our own /assets/ with the network shut', () => {
        sandboxedManifest.foo = 'foo.sandboxed.1a2b3c4d.js';

        const iframe = createSandboxIframe(sandboxedLibraryOptions('foo'));
        const csp = iframe.srcdoc.match(/content="([^"]*)"/)?.[1];

        expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
        expect(iframe.srcdoc).toContain(`<script src="${window.location.origin}/assets/foo.sandboxed.1a2b3c4d.js">`);
        expect(csp).toContain(
            `script-src ${window.location.origin}/assets/foo.sandboxed.1a2b3c4d.js 'wasm-unsafe-eval'`
        );
        expect(csp).toContain("connect-src 'none'");
    });

    it('passes asset files from our own /assets/ through to the host', () => {
        const assets = { wasm: '/assets/decoder.wasm', data: `${window.location.origin}/assets/tables.bin` };

        expect(sandboxedLibraryOptions('foo', { assets }).assets).toEqual(assets);
    });

    it('refuses asset files from anywhere else', () => {
        const withAsset = (url: string) => () => sandboxedLibraryOptions('foo', { assets: { wasm: url } });

        expect(withAsset('https://evil.test/assets/decoder.wasm')).toThrow('must be served from our own /assets/');
        expect(withAsset('/api/core/v4/users')).toThrow('must be served from our own /assets/');
        expect(withAsset('/assets/../api/core/v4/users')).toThrow('must be served from our own /assets/');
    });
});
