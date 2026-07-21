import { fireEvent, render, screen } from '@testing-library/react';

import { traceError } from '@proton/shared/lib/helpers/sentry';

import { SandboxedPreview } from './SandboxedPreview';

jest.mock('@proton/shared/lib/helpers/sentry');

const mockTraceError = traceError as jest.Mock;

const MIME_TYPE = 'text/plain';
const CONTENTS = [new Uint8Array([1, 2, 3])];

const getIframe = () => screen.getByTitle('Preview') as HTMLIFrameElement;

const fireSandboxMessage = (data: object, origin: string, source: any) => {
    fireEvent(window, new MessageEvent('message', { data, origin, source }));
};

// jsdom's Blob does not implement `.text()`, only FileReader can read its contents.
const readBlobAsText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });

describe('SandboxedPreview', () => {
    let createObjectURLSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        createObjectURLSpy = jest.fn().mockReturnValue('blob:mock-url');
        URL.createObjectURL = createObjectURLSpy;
        URL.revokeObjectURL = jest.fn();
    });

    it('renders an iframe locked down with allow-scripts-only sandboxing and a restrictive CSP', () => {
        render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);

        const iframe = getIframe();
        const csp = iframe.getAttribute('csp') || '';
        const scriptSrc = csp.match(/script-src[^;]*/)?.[0] || '';

        expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
        expect(csp).toContain("default-src 'self'");
        expect(csp).not.toContain('unsafe-eval');
        expect(scriptSrc).not.toContain('unsafe-inline');
        // Regression guard: `csp` is built from a global `origin`, shadowed by a same-named
        // local inside the effect. If that shadowing ever breaks, this silently becomes "undefined".
        expect(scriptSrc).toContain(window.location.origin);
        expect(csp).not.toContain('undefined');
    });

    it('does not leak the file contents or mime type into the sandboxed document markup', async () => {
        render(<SandboxedPreview mimeType="application/x-super-secret" contents={CONTENTS} />);

        const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
        const html = await readBlobAsText(blob);

        expect(html).not.toContain('x-super-secret');
        expect(html).toContain('/assets/sandbox.js');
    });

    it('only surfaces a sandbox error when it comes from the matching contentWindow with an opaque origin', () => {
        render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);

        const iframe = getIframe();
        fireEvent(iframe, new Event('load'));

        // Wrong source: not the sandbox's own contentWindow.
        fireSandboxMessage({ type: 'error', error: { name: 'Error', message: 'boom' } }, 'null', {});
        // Wrong origin: not the opaque 'null' origin a sandboxed iframe gets.
        fireSandboxMessage(
            { type: 'error', error: { name: 'Error', message: 'boom' } },
            'https://evil.example',
            iframe.contentWindow
        );
        expect(mockTraceError).not.toHaveBeenCalled();
        expect(screen.queryByTitle('Preview')).not.toBeNull();

        // Matching source and opaque origin: accepted.
        fireSandboxMessage(
            { type: 'error', error: { name: 'CustomError', message: 'boom' } },
            'null',
            iframe.contentWindow
        );
        expect(mockTraceError).toHaveBeenCalledTimes(1);
        expect(screen.queryByTitle('Preview')).toBeNull();
    });

    it('guards postMessage against a stale navigation and against sending the file contents twice', () => {
        // Scenario A: the sandboxed document navigated away before firing its load event.
        const { unmount } = render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);
        const staleIframe = getIframe();
        const stalePostMessageSpy = jest.spyOn(staleIframe.contentWindow as Window, 'postMessage');
        staleIframe.setAttribute('src', 'about:blank');
        fireEvent(staleIframe, new Event('load'));
        expect(stalePostMessageSpy).not.toHaveBeenCalled();
        unmount();

        // Scenario B: a normal load, fired twice, only sends the contents once.
        render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);
        const iframe = getIframe();
        const postMessageSpy = jest.spyOn(iframe.contentWindow as Window, 'postMessage');
        fireEvent(iframe, new Event('load'));
        fireEvent(iframe, new Event('load'));
        expect(postMessageSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'data', mimeType: MIME_TYPE }),
            '*'
        );
    });

    it('stops retrying once an error occurs, even if contents changes afterwards', () => {
        const { rerender } = render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);

        const iframe = getIframe();
        fireEvent(iframe, new Event('load'));
        fireSandboxMessage({ type: 'error', error: { name: 'Error', message: 'boom' } }, 'null', iframe.contentWindow);
        expect(screen.queryByTitle('Preview')).toBeNull();

        createObjectURLSpy.mockClear();
        rerender(<SandboxedPreview mimeType={MIME_TYPE} contents={[new Uint8Array([4, 5, 6])]} />);

        expect(screen.queryByTitle('Preview')).toBeNull();
        expect(createObjectURLSpy).not.toHaveBeenCalled();
    });

    it('revokes the blob url and removes its listeners on unmount', () => {
        const { unmount } = render(<SandboxedPreview mimeType={MIME_TYPE} contents={CONTENTS} />);

        const iframe = getIframe();
        const removeIframeListenerSpy = jest.spyOn(iframe, 'removeEventListener');
        const removeWindowListenerSpy = jest.spyOn(window, 'removeEventListener');

        unmount();

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        expect(removeIframeListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
        expect(removeWindowListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });
});
