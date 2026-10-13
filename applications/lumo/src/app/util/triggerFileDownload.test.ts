import { triggerFileDownload } from './triggerFileDownload';

// The Android WebView ignores `<a download href="blob:…">`, so non-image downloads (conversation
// exports, artifacts, PDF/PPTX, dev storage dumps) must go through `window.Android.saveBase64File`
// when the shell provides it — and must keep using the anchor fallback everywhere else, including
// on older Android shells that predate the file bridge.

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

describe('triggerFileDownload', () => {
    const originalFileReader = (global as any).FileReader;
    let click: jest.Mock;
    let revokeObjectURL: jest.Mock;
    let markdownBlob: Blob;

    beforeEach(() => {
        stubFileReader('data:text/markdown;base64,QUJD');
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
            blob: async () => markdownBlob,
        })) as any;
    });

    afterEach(() => {
        delete (window as any).Android;
        delete (window as any).webkit;
        (global as any).FileReader = originalFileReader;
        jest.restoreAllMocks();
    });

    it('sends a non-image file to the native bridge and skips the anchor download', async () => {
        const saveBase64File = jest.fn();
        (window as any).Android = { saveBase64File };

        await triggerFileDownload(new Blob(['ABC'], { type: 'text/markdown' }), 'chat.md', 'other');

        expect(saveBase64File).toHaveBeenCalledWith('QUJD', 'text/markdown', 'chat.md');
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
        global.fetch = jest.fn(async () => ({ blob: async () => imageBlob })) as any;
        const saveBase64Image = jest.fn();
        const saveBase64File = jest.fn();
        (window as any).Android = { saveBase64Image, saveBase64File };

        await triggerFileDownload(imageBlob, 'x.png', 'image');

        expect(saveBase64Image).toHaveBeenCalledWith('QUJD', 'image/png', 'x.png');
        expect(saveBase64File).not.toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
    });
});
