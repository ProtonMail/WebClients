import { waitFor } from '@testing-library/react';
import * as Comlink from 'comlink';
import { MessageChannel } from 'node:worker_threads';

import { INTERNAL_PING } from '../protocol';
import { collectSandboxedTransfers, createSandbox, createSandboxIframe } from './index';

/**
 * These assert the isolation construction, not that the browser honours it —
 * jsdom implements neither CSP nor opaque origins, so proving enforcement needs
 * a real browser. What they do catch is someone editing the attributes or the
 * CSP away, which is the realistic regression.
 */
describe('createSandboxIframe', () => {
    const inline = { kind: 'inline', code: 'void 0;' } as const;

    const cspOf = (iframe: HTMLIFrameElement): string => {
        const match = iframe.srcdoc.match(/content="([^"]*)"/);
        return match?.[1] ?? '';
    };

    it('sandboxes with allow-scripts and never allow-same-origin', () => {
        // The two together cancel each other out and give the frame our origin
        // back. If this test fails, isolation is gone — not degraded.
        const iframe = createSandboxIframe({ sandboxed: inline });

        expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    });

    it('blocks everything by default, network included', () => {
        const csp = cspOf(createSandboxIframe({ sandboxed: inline }));

        expect(csp).toContain("default-src 'none'");
        expect(csp).toContain("connect-src 'none'");
        expect(csp).toContain("img-src 'none'");
        expect(csp).toContain("style-src 'none'");
        expect(csp).toContain("font-src 'none'");
    });

    it('lets connect-src be narrowed to explicit origins', () => {
        const csp = cspOf(createSandboxIframe({ sandboxed: inline, csp: { connectSrc: 'https://proton.me' } }));

        expect(csp).toContain('connect-src https://proton.me');
    });

    it('refuses to let connect-src be widened', () => {
        const widen = (connectSrc: string) => () => createSandboxIframe({ sandboxed: inline, csp: { connectSrc } });

        expect(widen('*')).toThrow(/connect-src/);
        expect(widen("'none' *")).toThrow(/connect-src/);
        expect(widen('https:')).toThrow(/connect-src/);
        expect(widen("'self'")).toThrow(/connect-src/);
        expect(widen('http://evil.test')).toThrow(/connect-src/);
        expect(widen('https://*')).toThrow(/connect-src/);
        expect(widen('https://*.com')).toThrow(/connect-src/);
        expect(widen('https://proton.me;img-src')).toThrow(/connect-src/);
        expect(widen('https://proton.me"')).toThrow(/connect-src/);
    });

    it('runs inline sandboxed libraries under a nonce so injected script tags cannot run', () => {
        const iframe = createSandboxIframe({ sandboxed: inline });
        const nonce = iframe.srcdoc.match(/<script nonce="([^"]+)"/)?.[1];

        expect(nonce).toMatch(/^[0-9a-f]{32}$/);
        expect(cspOf(iframe)).toContain(`script-src 'nonce-${nonce}'`);
    });

    it.each(['</script>', '</SCRIPT>', '</script >', '</script\n>', '</script/>'])(
        'stops an inlined bundle breaking out of its own script tag with %j',
        (closingTag) => {
            const iframe = createSandboxIframe({ sandboxed: { kind: 'inline', code: `"${closingTag}<meta>"` } });

            expect(iframe.srcdoc.match(/<\/script/gi)).toHaveLength(1);
        }
    );

    it('scopes script-src to the exact script file, keeping the network shut', () => {
        const csp = cspOf(
            createSandboxIframe({
                sandboxed: { kind: 'script', url: 'https://drive.proton.me/assets/foo.sandboxed.js' },
            })
        );

        expect(csp).toContain("script-src https://drive.proton.me/assets/foo.sandboxed.js 'wasm-unsafe-eval'");
        expect(csp).toContain("connect-src 'none'");
    });

    it('hides a compute frame and fills the mount for a visible one', () => {
        const hidden = createSandboxIframe({ sandboxed: inline });
        const mount = document.createElement('div');
        const visible = createSandboxIframe({ sandboxed: inline, mount });

        expect(hidden.style.display).toBe('none');
        expect(hidden.getAttribute('aria-hidden')).toBe('true');
        expect(visible.style.display).toBe('');
        expect(visible.style.width).toBe('100%');
    });

    it('does not attach itself to the page', () => {
        const iframe = createSandboxIframe({ sandboxed: inline });

        expect(iframe.parentNode).toBeNull();
    });
});

describe('collectSandboxedTransfers', () => {
    it('refuses raw bytes, even nested, so callers pass a Blob', () => {
        expect(() => collectSandboxedTransfers(new ArrayBuffer(8))).toThrow(/Blob/);
        expect(() => collectSandboxedTransfers({ data: new Uint8Array(8) })).toThrow(/Blob/);
    });

    it('moves nothing for a Blob, since it is a handle and not the bytes', () => {
        expect(collectSandboxedTransfers({ file: new Blob(['pdf']) })).toEqual([]);
    });

    it('moves a stream, which cannot be copied', () => {
        const stream = new ReadableStream();

        expect(collectSandboxedTransfers([stream])).toEqual([stream]);
    });
});

describe('createSandbox lifecycle', () => {
    // jsdom has no MessageChannel and drops the ports passed to an iframe's
    // postMessage, so the test plays the sandboxed code: it takes the port the host
    // sends into each new frame and exposes `sandboxedApi` on it.
    let sandboxedApi: Record<string, (...args: any[]) => unknown> = {};
    let frames: HTMLIFrameElement[] = [];

    const observer = new MutationObserver((records) => {
        records.forEach((record) =>
            record.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLIFrameElement) || !node.contentWindow) {
                    return;
                }
                frames.push(node);
                Object.defineProperty(node.contentWindow, 'postMessage', {
                    value: (_message: unknown, _targetOrigin: string, [port]: MessagePort[]) => {
                        Comlink.expose({ [INTERNAL_PING]: () => true, ...sandboxedApi }, port);
                    },
                });
            })
        );
    });

    const liveFrames = () => frames.filter((frame) => frame.isConnected);

    beforeAll(() => {
        Object.defineProperty(globalThis, 'MessageChannel', { value: MessageChannel, configurable: true });
        observer.observe(document.body, { childList: true });
    });

    afterAll(() => {
        observer.disconnect();
    });

    beforeEach(() => {
        sandboxedApi = { echo: (value: string) => value, hang: () => new Promise(() => {}) };
        frames = [];
    });

    it('builds the frame on the first call and answers through it', async () => {
        const sandbox = createSandbox<{ echo: (value: string) => string }>({ sandboxed: { kind: 'inline', code: '' } });

        expect(liveFrames()).toHaveLength(0);
        expect(await sandbox.echo('hello')).toBe('hello');
        expect(liveFrames()).toHaveLength(1);
        sandbox.destroy();
    });

    it('rejects an in-flight call on destroy(), and every call after it', async () => {
        const sandbox = createSandbox<{ hang: () => void; echo: (value: string) => string }>({
            sandboxed: { kind: 'inline', code: '' },
        });
        await sandbox.ready;

        const pending = sandbox.hang();
        sandbox.destroy();

        await expect(pending).rejects.toThrow('Sandbox was destroyed mid-call');
        await expect(sandbox.echo('hello')).rejects.toThrow('Sandbox has been destroyed');
        await waitFor(() => expect(liveFrames()).toHaveLength(0));
    });

    it('drops a frame whose call timed out, so the next call gets a fresh one', async () => {
        const sandbox = createSandbox<{ hang: () => void; echo: (value: string) => string }>({
            sandboxed: { kind: 'inline', code: '' },
            timeoutMs: 50,
        });

        await expect(sandbox.hang()).rejects.toThrow('Sandbox call "hang" timed out');
        expect(await sandbox.echo('hello')).toBe('hello');
        expect(frames).toHaveLength(2);
        expect(liveFrames()).toHaveLength(1);
        sandbox.destroy();
    });

    it('tears an idle frame down and rebuilds it on the next call', async () => {
        const sandbox = createSandbox<{ echo: (value: string) => string }>({
            sandboxed: { kind: 'inline', code: '' },
            idleTimeoutMs: 50,
        });

        await sandbox.echo('hello');
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(liveFrames()).toHaveLength(0);

        expect(await sandbox.echo('again')).toBe('again');
        expect(frames).toHaveLength(2);
        sandbox.destroy();
    });
});
