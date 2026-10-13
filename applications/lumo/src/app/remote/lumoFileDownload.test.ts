import { saveFileViaNativeBridge, saveImageViaNativeBridge } from './lumoImageDownload';

// Locks the web→native contract for saving NON-image files (conversation exports, artifacts, PDF/PPTX,
// dev storage dumps) inside the Android WebView, where `<a download href="blob:…">` silently does nothing.
// Android exposes `window.Android.saveBase64File(base64, mimeType, name)` — same shape as
// `saveBase64Image`, same rule that the base64 payload MUST NOT carry the `data:...;base64,` prefix.
// The file bridge is Android-only: routing a `.md` to the iOS `saveImage` handler would be wrong, so
// the iOS handler must never be used for files. Older shells without `saveBase64File` must report
// unavailable and keep today's browser-download behaviour.

// jsdom's FileReader can't read a real Blob's bytes reliably across environments, so we stub
// FileReader with a deterministic data URL to assert prefix stripping precisely.
const stubFileReader = (dataUrl: string) => {
    class StubFileReader {
        public result: string | null = null;

        public onloadend: (() => void) | null = null;

        public onerror: (() => void) | null = null;

        readAsDataURL() {
            this.result = dataUrl;
            this.onloadend?.();
        }
    }
    (global as any).FileReader = StubFileReader;
};

describe('native file download bridge', () => {
    const originalFileReader = (global as any).FileReader;

    afterEach(() => {
        delete (window as any).Android;
        delete (window as any).webkit;
        (global as any).FileReader = originalFileReader;
    });

    describe('saveFileViaNativeBridge', () => {
        it('forwards prefix-stripped base64, mime type and name to saveBase64File', async () => {
            stubFileReader('data:text/markdown;base64,QUJD');
            const saveBase64File = jest.fn();
            (window as any).Android = { saveBase64File };

            const blob = new Blob(['ABC'], { type: 'text/markdown' });
            const result = await saveFileViaNativeBridge(blob, 'chat.md');

            expect(result).toBe(true);
            expect(saveBase64File).toHaveBeenCalledWith('QUJD', 'text/markdown', 'chat.md');
        });

        it('falls back to application/octet-stream when the blob has no type', async () => {
            stubFileReader('data:application/octet-stream;base64,QUJD');
            const saveBase64File = jest.fn();
            (window as any).Android = { saveBase64File };

            const blob = new Blob(['ABC']); // no type
            const result = await saveFileViaNativeBridge(blob, 'dump.json');

            expect(result).toBe(true);
            expect(saveBase64File).toHaveBeenCalledWith('QUJD', 'application/octet-stream', 'dump.json');
        });

        it('returns false on an old Android shell that only has saveBase64Image', async () => {
            stubFileReader('data:text/markdown;base64,QUJD');
            (window as any).Android = { saveBase64Image: jest.fn() };

            expect(await saveFileViaNativeBridge(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md')).toBe(false);
        });

        it('never routes a file to the iOS saveImage handler', async () => {
            stubFileReader('data:text/markdown;base64,QUJD');
            const postMessage = jest.fn();
            (window as any).webkit = { messageHandlers: { saveImage: { postMessage } } };

            expect(await saveFileViaNativeBridge(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md')).toBe(false);
            expect(postMessage).not.toHaveBeenCalled();
        });

        it('returns false when no bridge is present at all', async () => {
            stubFileReader('data:text/markdown;base64,QUJD');
            expect(await saveFileViaNativeBridge(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md')).toBe(false);
        });

        it('returns false instead of throwing when the native method blows up', async () => {
            stubFileReader('data:text/markdown;base64,QUJD');
            (window as any).Android = {
                saveBase64File: jest.fn(() => {
                    throw new Error('native boom');
                }),
            };
            jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(await saveFileViaNativeBridge(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md')).toBe(false);
        });
    });

    describe('image bridge is unaffected by the file bridge', () => {
        it('still uses saveBase64Image when both methods exist', async () => {
            stubFileReader('data:image/png;base64,QUJD');
            const saveBase64Image = jest.fn();
            const saveBase64File = jest.fn();
            (window as any).Android = { saveBase64Image, saveBase64File };

            expect(await saveImageViaNativeBridge(new Blob(['ABC'], { type: 'image/png' }), 'x.png')).toBe(true);
            expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'x.png');
            expect(saveBase64File).not.toHaveBeenCalled();
        });
    });
});
