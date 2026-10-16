import JSZip from 'jszip';

import { getCBZCover, getExtractedImagesFromCBZ } from './ComicBookPreview';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const HTML_PAYLOAD = '<!--\nalert(document.domain);\n-->\n//<script src="#payload"></script>';

const createCBZ = async (entries: Record<string, Uint8Array<ArrayBuffer> | string>) => {
    const zip = new JSZip();
    Object.entries(entries).forEach(([name, content]) => zip.file(name, content));
    return zip.generateAsync({ type: 'blob' });
};

describe('ComicBookPreview', () => {
    describe('getCBZCover', () => {
        it('should return the first entry with a valid image signature, typed explicitly', async () => {
            const cbz = await createCBZ({ '01.png': PNG_BYTES, '02.jpg': JPEG_BYTES });

            const { cover, file } = await getCBZCover(cbz);

            expect(cover).toBe('01.png');
            expect(file?.type).toBe('image/png');
        });

        it('should skip entries with an image extension but non-image content', async () => {
            const cbz = await createCBZ({ '01.png': HTML_PAYLOAD, '02.jpg': JPEG_BYTES });

            const { cover, file } = await getCBZCover(cbz);

            expect(cover).toBe('02.jpg');
            expect(file?.type).toBe('image/jpeg');
        });

        it('should return no cover when no entry is a valid image', async () => {
            const cbz = await createCBZ({ 'page.png': HTML_PAYLOAD });

            expect(await getCBZCover(cbz)).toEqual({ cover: undefined, file: undefined });
        });
    });

    describe('getExtractedImagesFromCBZ', () => {
        const originalCreateObjectURL = URL.createObjectURL;
        let createObjectURL: jest.Mock;

        beforeEach(() => {
            createObjectURL = jest.fn((blob: Blob) => `blob:${blob.type}`);
            URL.createObjectURL = createObjectURL;
        });

        afterEach(() => {
            URL.createObjectURL = originalCreateObjectURL;
        });

        it('should only create object URLs for valid images, with their image MIME type', async () => {
            const cbz = await createCBZ({
                '01.png': PNG_BYTES,
                '02.png': HTML_PAYLOAD,
                '03.jpeg': JPEG_BYTES,
                'ComicInfo.xml': '<ComicInfo />',
            });

            const urls = await getExtractedImagesFromCBZ(cbz);

            expect(urls).toEqual(['blob:image/png', 'blob:image/jpeg']);
            expect(createObjectURL).toHaveBeenCalledTimes(2);
        });
    });
});
