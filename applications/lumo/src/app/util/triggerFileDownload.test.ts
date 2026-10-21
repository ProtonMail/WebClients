import { triggerFileDownload } from './triggerFileDownload';

// The Android WebView ignores `<a download href="blob:…">`, so non-image downloads (conversation
// exports, artifacts, PDF/PPTX, dev storage dumps) must go through `window.Android.saveBase64File`
// when the shell provides it — and must keep using the anchor fallback everywhere else, including
// on older Android shells that predate the file bridge.

// The test environment uses Node Blobs, which jsdom's FileReader cannot read.
// Read their actual bytes so a wrong Blob or broken data-URL decoding cannot pass.
const stubFileReader = () => {
    class StubFileReader {
        public result: string | null = null;

        public onloadend: (() => void) | null = null;

        public onerror: (() => void) | null = null;

        async readAsDataURL(blob: Blob) {
            this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
            this.onloadend?.();
        }
    }
    (global as any).FileReader = StubFileReader;
};

describe('triggerFileDownload', () => {
    const originalFileReader = (global as any).FileReader;
    const originalFetch = global.fetch;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    let click: jest.Mock;
    let revokeObjectURL: jest.Mock;
    let markdownBlob: Blob;

    beforeEach(() => {
        stubFileReader();
        // fetch is mocked to hand back this shared blob, so the MIME assertion below proves the
        // bridge got the blob's own type rather than the octet-stream default.
        markdownBlob = new Blob(['ABC'], { type: 'text/markdown' });
        click = jest.fn();
        jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
            jest.spyOn(node as HTMLElement, 'click').mockImplementation(click);
            jest.spyOn(node as HTMLElement, 'remove').mockImplementation(() => undefined);
            return node;
        });
        revokeObjectURL = jest.fn();
        (URL as any).createObjectURL = jest.fn(() => 'blob:fake');
        (URL as any).revokeObjectURL = revokeObjectURL;
        global.fetch = jest.fn(async () => ({
            ok: true,
            blob: async () => markdownBlob,
        })) as any;
    });

    afterEach(() => {
        delete (window as any).Android;
        delete (window as any).webkit;
        (global as any).FileReader = originalFileReader;
        global.fetch = originalFetch;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        jest.restoreAllMocks();
    });

    it('sends a non-image file to the native bridge and skips the anchor download', async () => {
        const saveBase64File = jest.fn();
        (window as any).Android = { saveBase64File };

        await triggerFileDownload(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md', 'other');

        expect(saveBase64File).toHaveBeenCalledWith('QUJD', 'text/markdown', 'chat.md');
        expect(global.fetch).not.toHaveBeenCalled();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });

    it('falls back to the anchor download on an old shell without saveBase64File', async () => {
        (window as any).Android = { saveBase64Image: jest.fn() };

        await triggerFileDownload(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md', 'other');

        expect(click).toHaveBeenCalledTimes(1);
    });

    it('falls back to the anchor download when the native bridge throws', async () => {
        (window as any).Android = {
            saveBase64File: jest.fn(() => {
                throw new Error('native boom');
            }),
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});

        await triggerFileDownload(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md', 'other');

        expect(click).toHaveBeenCalledTimes(1);
        // The blob URL must still be alive when the anchor clicks, so cleanup happens afterwards.
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('keeps using saveBase64Image for images even when saveBase64File exists', async () => {
        const imageBlob = new Blob(['ABC'], { type: 'image/png' });
        global.fetch = jest.fn(async () => ({ ok: true, blob: async () => imageBlob })) as any;
        const saveBase64Image = jest.fn();
        const saveBase64File = jest.fn();
        (window as any).Android = { saveBase64Image, saveBase64File };

        await triggerFileDownload(imageBlob, 'x.png', 'image');

        expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'x.png');
        expect(saveBase64File).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });
    it.each(['android', 'ios'])('hands image Blobs directly to %s without fetch or object URLs', async (platform) => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        const save = jest.fn();
        if (platform === 'android') {
            (window as any).Android = { saveBase64Image: save };
        } else {
            (window as any).webkit = { messageHandlers: { saveImage: { postMessage: save } } };
        }
        await triggerFileDownload(new Blob(['ABC'], { type: 'image/png' }), 'chart.png', 'image');
        if (platform === 'android') {
            expect(save).toHaveBeenCalledWith('QUJD', 'image/png', 'chart.png');
        } else {
            expect(save).toHaveBeenCalledWith({ base64: 'QUJD', mimeType: 'image/png', name: 'chart.png' });
        }
        expect(global.fetch).not.toHaveBeenCalled();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });

    it('reports native image failures instead of silently using an unsupported anchor', async () => {
        (window as any).Android = {
            saveBase64Image: jest.fn(() => {
                throw new Error('native boom');
            }),
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
            triggerFileDownload(new Blob(['ABC'], { type: 'image/png' }), 'chart.png', 'image')
        ).rejects.toThrow();
        expect(click).not.toHaveBeenCalled();
    });

    it('reports URL fetch failures to the image caller', async () => {
        (window as any).Android = { saveBase64Image: jest.fn() };
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(triggerFileDownload('blob:expired', 'chart.png', 'image')).rejects.toThrow('Failed to fetch');
        expect(click).not.toHaveBeenCalled();
    });

    it('downloads browser images using an object URL and revokes it after clicking', async () => {
        await triggerFileDownload(new Blob(['ABC'], { type: 'image/png' }), 'chart.png', 'image');
        const link = jest.mocked(document.body.appendChild).mock.calls[0][0] as HTMLAnchorElement;
        expect(link.download).toBe('chart.png');
        expect(link.href).toBe('blob:fake');
        expect(click).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('decodes base64 image URLs locally when data: fetch is blocked by CSP', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        const saveBase64Image = jest.fn();
        (window as any).Android = { saveBase64Image };
        await triggerFileDownload('data:image/png;base64,AP%2BAYQ==', 'image.png', 'image');
        expect(saveBase64Image).toHaveBeenCalledWith('AP+AYQ==', 'image/png', 'image.png');
        expect(global.fetch).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });

    it('fetches blob URLs without taking ownership of their lifetime', async () => {
        (window as any).Android = { saveBase64Image: jest.fn() };
        await triggerFileDownload('blob:caller-owned', 'image.png', 'image');
        expect(global.fetch).toHaveBeenCalledWith('blob:caller-owned');
        expect(revokeObjectURL).not.toHaveBeenCalled();
    });
    it('does not hand an HTTP error page to the native image saver', async () => {
        const saveBase64Image = jest.fn();
        (window as any).Android = { saveBase64Image };
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
        await expect(triggerFileDownload('https://example.test/image.png', 'image.png', 'image')).rejects.toThrow(
            '404'
        );
        expect(saveBase64Image).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });

    it('reports malformed base64 without attempting a fetch or browser fallback', async () => {
        (window as any).Android = { saveBase64Image: jest.fn() };
        await expect(triggerFileDownload('data:image/png;base64,!!!', 'image.png', 'image')).rejects.toThrow();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });
});
