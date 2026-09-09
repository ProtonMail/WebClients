import { act, renderHook } from '@testing-library/react';

import { getArtifactShellUrl } from './artifactShell';
import { useArtifactShellIframe } from './useArtifactShellIframe';

const CROSS_ORIGIN_APP = 'https://lumo.proton.dev:4443';

function mockAppOrigin(origin: string): void {
    Object.defineProperty(window, 'location', {
        value: new URL(origin),
        writable: true,
        configurable: true,
    });
}

function createAttachedIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    return iframe;
}

describe('useArtifactShellIframe', () => {
    beforeEach(() => {
        mockAppOrigin(CROSS_ORIGIN_APP);
    });

    it('reports isCrossOrigin false on same-origin localhost shells', () => {
        mockAppOrigin('https://localhost:3000');

        const { result } = renderHook(() => useArtifactShellIframe('<p>hi</p>'));

        expect(result.current.isCrossOrigin).toBe(false);
        expect(result.current.ready).toBe(false);
    });

    it('does not post the artifact html until the iframe fires onLoad', () => {
        const { result } = renderHook(() => useArtifactShellIframe('<p>hi</p>'));

        const iframe = createAttachedIframe();
        Object.defineProperty(result.current.iframeRef, 'current', { value: iframe, writable: true });
        const postMessage = jest.spyOn(iframe.contentWindow as Window, 'postMessage');

        expect(result.current.ready).toBe(false);
        expect(postMessage).not.toHaveBeenCalled();
    });

    it('posts the artifact html to the shell origin once the iframe has loaded', () => {
        const { result } = renderHook(() => useArtifactShellIframe('<p>hi</p>'));

        const iframe = createAttachedIframe();
        Object.defineProperty(result.current.iframeRef, 'current', { value: iframe, writable: true });
        const postMessage = jest.spyOn(iframe.contentWindow as Window, 'postMessage');

        const shellOrigin = getArtifactShellUrl().origin;

        act(() => {
            result.current.onIframeLoad();
        });

        expect(result.current.ready).toBe(true);
        expect(postMessage).toHaveBeenCalledWith({ type: 'lumo-artifact-html', html: '<p>hi</p>' }, shellOrigin);
    });

    it('resends the current html on every load event, in case the shell reloads', () => {
        const { result, rerender } = renderHook(({ html }) => useArtifactShellIframe(html), {
            initialProps: { html: '<p>v1</p>' },
        });

        const iframe = createAttachedIframe();
        Object.defineProperty(result.current.iframeRef, 'current', { value: iframe, writable: true });
        const postMessage = jest.spyOn(iframe.contentWindow as Window, 'postMessage');
        const shellOrigin = getArtifactShellUrl().origin;

        act(() => {
            result.current.onIframeLoad();
        });
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'lumo-artifact-html', html: '<p>v1</p>' }, shellOrigin);

        rerender({ html: '<p>v2</p>' });
        expect(result.current.ready).toBe(false);
        expect(result.current.shellMountKey).toBe(1);
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'lumo-artifact-html', html: '<p>v1</p>' }, shellOrigin);

        act(() => {
            result.current.onIframeLoad();
        });
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'lumo-artifact-html', html: '<p>v2</p>' }, shellOrigin);
    });

    it('bumps shellMountKey when html changes so the iframe can remount cleanly', () => {
        const { result, rerender } = renderHook(({ html }) => useArtifactShellIframe(html), {
            initialProps: { html: '<p>v1</p>' },
        });

        expect(result.current.shellMountKey).toBe(0);

        rerender({ html: '<p>v2</p>' });

        expect(result.current.shellMountKey).toBe(1);
    });

    it('does not postMessage on localhost where the shell is same-origin', () => {
        mockAppOrigin('https://localhost:3000');

        const { result } = renderHook(() => useArtifactShellIframe('<p>hi</p>'));

        const iframe = createAttachedIframe();
        Object.defineProperty(result.current.iframeRef, 'current', { value: iframe, writable: true });
        const postMessage = jest.spyOn(iframe.contentWindow as Window, 'postMessage');

        act(() => {
            result.current.onIframeLoad();
        });

        expect(postMessage).not.toHaveBeenCalled();
    });
});
