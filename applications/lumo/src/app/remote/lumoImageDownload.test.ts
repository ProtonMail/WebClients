import { downloadImage, isNativeImageBridgeAvailable, saveImageViaNativeBridge } from './lumoImageDownload';

// Locks the web→native contract for saving generated images inside the native shells.
// Android exposes `window.Android.saveBase64Image(base64, mimeType, name)`; iOS exposes a
// `saveImage` WKScriptMessageHandler receiving `{ base64, mimeType, name }`. In both cases the
// base64 payload MUST NOT carry the `data:...;base64,` prefix — renaming the handler/method or
// leaking the prefix would silently break saving on the native side.

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

describe('nativeImageDownload', () => {
    const originalFileReader = (global as any).FileReader;

    afterEach(() => {
        delete (window as any).Android;
        delete (window as any).webkit;
        (global as any).FileReader = originalFileReader;
    });

    describe('isNativeImageBridgeAvailable', () => {
        it('is true when the Android save method is present', () => {
            (window as any).Android = { saveBase64Image: jest.fn() };
            expect(isNativeImageBridgeAvailable()).toBe(true);
        });

        it('is true when the iOS saveImage handler is present', () => {
            (window as any).webkit = { messageHandlers: { saveImage: { postMessage: jest.fn() } } };
            expect(isNativeImageBridgeAvailable()).toBe(true);
        });

        it('is false when neither bridge is present', () => {
            expect(isNativeImageBridgeAvailable()).toBe(false);
        });

        it('is false when Android exists but lacks saveBase64Image', () => {
            (window as any).Android = {};
            expect(isNativeImageBridgeAvailable()).toBe(false);
        });

        it('is false when other handlers are registered but saveImage is not', () => {
            // The shell already registers unrelated handlers (e.g. lumoApp) — saveImage must not
            // be inferred from the mere presence of messageHandlers.
            (window as any).webkit = { messageHandlers: { lumoApp: { postMessage: jest.fn() } } };
            expect(isNativeImageBridgeAvailable()).toBe(false);
        });

        it('is false inside a WKWebView where messageHandlers reads truthy for unregistered handlers', () => {
            // Reproduces the real bug: WKWebView's messageHandlers is backed by a native object
            // that returns a truthy, callable-looking value for ANY handler name, so a plain
            // truthiness check falsely reports saveImage as available.
            const messageHandlers = new Proxy(
                {},
                {
                    get: () => ({ postMessage: jest.fn() }),
                }
            );
            (window as any).webkit = { messageHandlers };
            expect(isNativeImageBridgeAvailable()).toBe(false);
        });

        it('is false when saveImage exists but has no postMessage function', () => {
            (window as any).webkit = { messageHandlers: { saveImage: {} } };
            expect(isNativeImageBridgeAvailable()).toBe(false);
        });
    });

    describe('saveImageViaNativeBridge', () => {
        it('forwards prefix-stripped base64, mime type and name to the Android bridge', async () => {
            stubFileReader('data:image/png;base64,QUJD');
            const saveBase64Image = jest.fn();
            (window as any).Android = { saveBase64Image };

            const blob = new Blob(['ABC'], { type: 'image/png' });
            const result = await saveImageViaNativeBridge(blob, 'my-image.png');

            expect(result).toBe(true);
            expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'my-image.png');
        });

        it('posts prefix-stripped base64, mime type and name to the iOS handler', async () => {
            stubFileReader('data:image/jpeg;base64,WFla');
            const postMessage = jest.fn();
            (window as any).webkit = { messageHandlers: { saveImage: { postMessage } } };

            const blob = new Blob(['XYZ'], { type: 'image/jpeg' });
            const result = await saveImageViaNativeBridge(blob, 'photo.jpg');

            expect(result).toBe(true);
            expect(postMessage).toHaveBeenCalledWith({
                base64: 'WFla',
                mimeType: 'image/jpeg',
                name: 'photo.jpg',
            });
        });

        it('prefers the Android bridge when both are present', async () => {
            stubFileReader('data:image/png;base64,QUJD');
            const saveBase64Image = jest.fn();
            const postMessage = jest.fn();
            (window as any).Android = { saveBase64Image };
            (window as any).webkit = { messageHandlers: { saveImage: { postMessage } } };

            const blob = new Blob(['ABC'], { type: 'image/png' });
            await saveImageViaNativeBridge(blob, 'x.png');

            expect(saveBase64Image).toHaveBeenCalledTimes(1);
            expect(postMessage).not.toHaveBeenCalled();
        });

        it('falls back to image/png when the blob has no type', async () => {
            stubFileReader('data:application/octet-stream;base64,QUJD');
            const saveBase64Image = jest.fn();
            (window as any).Android = { saveBase64Image };

            const blob = new Blob(['ABC']); // no type
            await saveImageViaNativeBridge(blob, 'x.png');

            expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'x.png');
        });

        it('returns false when no bridge is present', async () => {
            stubFileReader('data:image/png;base64,QUJD');
            const blob = new Blob(['ABC'], { type: 'image/png' });
            expect(await saveImageViaNativeBridge(blob, 'x.png')).toBe(false);
        });
    });

    describe('downloadImage', () => {
        let clickSpy: jest.SpyInstance;

        beforeEach(() => {
            clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        });

        afterEach(() => {
            clickSpy.mockRestore();
            delete (global as any).fetch;
        });

        it('triggers a browser download (<a download> click) on the web when no bridge is present', async () => {
            await downloadImage('blob:https://lumo/abc', 'web-image.png');

            expect(clickSpy).toHaveBeenCalledTimes(1);
            const link = clickSpy.mock.instances[0] as HTMLAnchorElement;
            expect(link.href).toBe('blob:https://lumo/abc');
            expect(link.download).toBe('web-image.png');
        });

        it('routes to the native bridge and skips the browser download when a bridge is present', async () => {
            stubFileReader('data:image/png;base64,QUJD');
            const saveBase64Image = jest.fn();
            (window as any).Android = { saveBase64Image };
            (global as any).fetch = jest.fn().mockResolvedValue({
                blob: async () => new Blob(['ABC'], { type: 'image/png' }),
            });

            await downloadImage('blob:https://lumo/abc', 'native-image.png');

            expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'native-image.png');
            expect(clickSpy).not.toHaveBeenCalled();
        });

        it('falls back to the browser download when fetching the image for the native save fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            (window as any).Android = { saveBase64Image: jest.fn() };
            (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));

            await downloadImage('blob:https://lumo/abc', 'fallback.png');

            expect(clickSpy).toHaveBeenCalledTimes(1);
            consoleError.mockRestore();
        });
    });
});
