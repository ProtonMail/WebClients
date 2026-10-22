import { getExifInfo } from './exifParser';

const DATE_TIME_ORIGINAL = '2024:01:07 09:00:53';
const PADDING_SIZE = 10 * 1024 * 1024;

// Little-endian TIFF block: IFD0 --> Exif IFD --> DateTimeOriginal
const createTiffWithDateTimeOriginal = () => {
    const tiff = new Uint8Array(64);
    const view = new DataView(tiff.buffer);
    tiff.set([0x49, 0x49, 0x2a, 0x00]);
    view.setUint32(4, 8, true);

    view.setUint16(8, 1, true);
    view.setUint16(10, 0x8769, true);
    view.setUint16(12, 4, true);
    view.setUint32(14, 1, true);
    view.setUint32(18, 26, true);
    view.setUint32(22, 0, true);

    view.setUint16(26, 1, true);
    view.setUint16(28, 0x9003, true);
    view.setUint16(30, 2, true);
    view.setUint32(32, 20, true);
    view.setUint32(36, 44, true);
    view.setUint32(40, 0, true);

    tiff.set(new TextEncoder().encode(`${DATE_TIME_ORIGINAL}\0`), 44);
    return tiff;
};

const createLargeJpegWithExif = () => {
    const tiff = createTiffWithDateTimeOriginal();
    const app1Length = 2 + 6 + tiff.length;
    const app1 = new Uint8Array([0xff, 0xe1, app1Length >> 8, app1Length & 0xff, 0x45, 0x78, 0x69, 0x66, 0, 0]);
    const startOfScan = new Uint8Array([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]);
    return new File(
        [
            new Uint8Array([0xff, 0xd8]),
            app1,
            tiff,
            startOfScan,
            new Uint8Array(PADDING_SIZE),
            new Uint8Array([0xff, 0xd9]),
        ],
        'photo.jpg',
        { type: 'image/jpeg' }
    );
};

const trackBytesRead = () => {
    const originalSlice = Blob.prototype.slice;
    let bytesRead = 0;
    jest.spyOn(Blob.prototype, 'slice').mockImplementation(function (this: Blob, ...args) {
        const chunk = originalSlice.apply(this, args);
        bytesRead += chunk.size;
        return chunk;
    });
    return { getBytesRead: () => bytesRead };
};

describe('getExifInfo', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return undefined for non-image mime types', async () => {
        const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

        const result = await getExifInfo(file, 'application/pdf');

        expect(result).toBeUndefined();
    });

    it('should read EXIF data from a JPEG without loading the whole file', async () => {
        const file = createLargeJpegWithExif();
        const arrayBufferSpy = jest.fn();
        file.arrayBuffer = arrayBufferSpy;
        const bytesRead = trackBytesRead();

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result?.exif?.DateTimeOriginal?.description).toBe(DATE_TIME_ORIGINAL);
        expect(arrayBufferSpy).not.toHaveBeenCalled();
        expect(bytesRead.getBytesRead()).toBeLessThan(1024 * 1024);
    });

    it('should not load the whole file when a JPEG has no EXIF data', async () => {
        const jfifSegment = [
            0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
        ];
        const file = new File(
            [
                new Uint8Array([
                    0xff,
                    0xd8,
                    ...jfifSegment,
                    0xff,
                    0xda,
                    0x00,
                    0x08,
                    0x01,
                    0x01,
                    0x00,
                    0x00,
                    0x3f,
                    0x00,
                ]),
                new Uint8Array(PADDING_SIZE),
                new Uint8Array([0xff, 0xd9]),
            ],
            'screenshot.jpg',
            { type: 'image/jpeg' }
        );
        const arrayBufferSpy = jest.fn();
        file.arrayBuffer = arrayBufferSpy;
        const bytesRead = trackBytesRead();

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result?.exif).toBeUndefined();
        expect(arrayBufferSpy).not.toHaveBeenCalled();
        expect(bytesRead.getBytesRead()).toBeLessThan(1024 * 1024);
    });

    it('should fall back to a full read for plain TIFF files', async () => {
        const tiff = createTiffWithDateTimeOriginal();
        const file = new File([tiff], 'photo.tiff', { type: 'image/tiff' });
        file.arrayBuffer = jest.fn().mockResolvedValue(tiff.buffer);

        const result = await getExifInfo(file, 'image/tiff');

        expect(result?.exif?.DateTimeOriginal?.description).toBe(DATE_TIME_ORIGINAL);
        expect(file.arrayBuffer).toHaveBeenCalled();
    });

    it('should return undefined and warn when the file has no readable EXIF data', async () => {
        const content = new TextEncoder().encode('not an image');
        const file = new File([content], 'photo.jpg', { type: 'image/jpeg' });
        file.arrayBuffer = jest.fn().mockResolvedValue(content.buffer);

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot read exif data');
    });
});
