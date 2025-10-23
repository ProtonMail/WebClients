import { mimeTypeFromExtension } from './mimeTypeFromExtension';

describe('mimetypeFromExtension', () => {
    test('Uses EXTRA_EXTENSION_TYPES when available', async () => {
        expect(await mimeTypeFromExtension('script.py')).toBe('text/x-python');
        expect(await mimeTypeFromExtension('component.ts')).toBe('application/typescript');
        expect(await mimeTypeFromExtension('photo.jxl')).toBe('image/jxl');
    });

    test('Falls back to mime-types library lookup', async () => {
        expect(await mimeTypeFromExtension('photo.jpg')).toBe('image/jpeg');
        expect(await mimeTypeFromExtension('video.mp4')).toBe('video/mp4');
        expect(await mimeTypeFromExtension('document.pdf')).toBe('application/pdf');
    });

    test('Handles case-insensitive extensions', async () => {
        expect(await mimeTypeFromExtension('script.PY')).toBe('text/x-python');
        expect(await mimeTypeFromExtension('photo.JPG')).toBe('image/jpeg');
    });

    test('Returns falsy for unknown or missing extensions', async () => {
        expect(await mimeTypeFromExtension('README')).toBeFalsy();
        expect(await mimeTypeFromExtension('file.unknownext')).toBeFalsy();
        expect(await mimeTypeFromExtension('')).toBeFalsy();
    });

    test('Handles files with multiple dots', async () => {
        expect(await mimeTypeFromExtension('my.file.name.jpg')).toBe('image/jpeg');
    });
});
