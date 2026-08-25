import { getIframeDocument } from './getIframeDocument';

describe('getIframeDocument', () => {
    it('returns null when there is no iframe', () => {
        expect(getIframeDocument(null)).toBeNull();

        expect(getIframeDocument(undefined)).toBeNull();
    });

    it('returns the document of a same-origin frame', () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);

        expect(getIframeDocument(iframe)).toBe(iframe.contentDocument);

        iframe.remove();
    });

    it('returns null when access throws', () => {
        const iframe = {
            get contentDocument(): Document {
                throw new Error('SecurityError');
            },
        };

        expect(getIframeDocument(iframe as HTMLIFrameElement)).toBeNull();
    });
});
