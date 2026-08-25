import { act, renderHook } from '@testing-library/react';

import { getArtifactShellUrl } from './artifactShell';
import { useArtifactShellIframe } from './useArtifactShellIframe';

function createAttachedIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    return iframe;
}

describe('useArtifactShellIframe', () => {
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
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'lumo-artifact-html', html: '<p>v2</p>' }, shellOrigin);

        act(() => {
            result.current.onIframeLoad();
        });
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'lumo-artifact-html', html: '<p>v2</p>' }, shellOrigin);
    });
});
