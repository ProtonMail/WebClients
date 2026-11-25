import type { MockInstance } from 'vitest';

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

// ExifReader does not check chunk CRCs, so they are left as zeros
const createPngChunk = (type: string, data: Uint8Array<ArrayBuffer>) => {
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    new DataView(chunk.buffer).setUint32(0, data.length);
    chunk.set(new TextEncoder().encode(type), 4);
    chunk.set(data, 8);
    return chunk;
};

// The eXIf chunk starts after the signature (8 bytes), the IHDR chunk (25 bytes) and the IDAT chunk (12 bytes + data)
const EXIF_CHUNK_OFFSET_WITHOUT_IMAGE_DATA = 8 + 25 + 12;
const EXIF_CHUNK_SIZE = 12 + 64; // chunk framing + the 64-byte TIFF block

const createPngWithExifAfterImageData = (imageDataSize = 2 * 1024 * 1024) => {
    const header = new Uint8Array(13);
    const view = new DataView(header.buffer);
    view.setUint32(0, 1);
    view.setUint32(4, 1);
    header.set([8, 6, 0, 0, 0], 8);
    return new File(
        [
            new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            createPngChunk('IHDR', header),
            // The default 2 MB of image data puts the eXIf chunk past the 1 MB head read for images over 100 MB
            createPngChunk('IDAT', new Uint8Array(imageDataSize)),
            createPngChunk('eXIf', createTiffWithDateTimeOriginal()),
            createPngChunk('IEND', new Uint8Array(0)),
        ],
        'image.png',
        { type: 'image/png' }
    );
};

// Reports a multi-GB size without allocating it: reads only reach the real content
const withReportedSize = (file: File, size: number) => {
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

const TEN_GB = 10 * 1024 * 1024 * 1024;
const MAX_EXIF_FULL_READ_SIZE = 100 * 1024 * 1024;
const EXIF_HEAD_SIZE = 1024 * 1024;

// Counts the bytes loaded into memory: ExifReader reads blobs with FileReader, the fallback with arrayBuffer().
// Slices are not counted, they reference the file without reading it.
const trackBytesRead = () => {
    const originalReadAsArrayBuffer = FileReader.prototype.readAsArrayBuffer;
    const originalArrayBuffer = Blob.prototype.arrayBuffer;
    let bytesRead = 0;
    vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader, blob: Blob) {
        bytesRead += blob.size;
        return originalReadAsArrayBuffer.call(this, blob);
    });
    vi.spyOn(Blob.prototype, 'arrayBuffer').mockImplementation(function (this: Blob) {
        bytesRead += this.size;
        return originalArrayBuffer.call(this);
    });
    return { getBytesRead: () => bytesRead };
};

describe('getExifInfo', () => {
    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return undefined for non-image mime types', async () => {
        const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

        const result = await getExifInfo(file, 'application/pdf');

        expect(result).toBeUndefined();
    });

    it('should read EXIF data from a JPEG without loading the whole file', async () => {
        const file = createLargeJpegWithExif();
        const arrayBufferSpy = vi.fn();
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
        const arrayBufferSpy = vi.fn();
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
        file.arrayBuffer = vi.fn().mockResolvedValue(tiff.buffer);

        const result = await getExifInfo(file, 'image/tiff');

        expect(result?.exif?.DateTimeOriginal?.description).toBe(DATE_TIME_ORIGINAL);
        expect(file.arrayBuffer).toHaveBeenCalled();
    });

    it('should return undefined and warn when the file has no readable EXIF data', async () => {
        const content = new TextEncoder().encode('not an image');
        const file = new File([content], 'photo.jpg', { type: 'image/jpeg' });
        file.arrayBuffer = vi.fn().mockResolvedValue(content.buffer);

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot read exif data');
    });

    it('should not load a multi-GB image whose head has no readable metadata', async () => {
        const file = withReportedSize(
            new File([new Uint8Array(PADDING_SIZE)], 'image.png', { type: 'image/png' }),
            TEN_GB
        );
        file.arrayBuffer = vi.fn();
        const bytesRead = trackBytesRead();

        const result = await getExifInfo(file, 'image/png');

        expect(result).toBeUndefined();
        expect(file.arrayBuffer).not.toHaveBeenCalled();
        expect(bytesRead.getBytesRead()).toBeLessThanOrEqual(2 * 1024 * 1024);
    });

    it('should read EXIF data from the head of a multi-GB plain TIFF without loading the whole file', async () => {
        const file = withReportedSize(
            new File([createTiffWithDateTimeOriginal(), new Uint8Array(PADDING_SIZE)], 'photo.tiff', {
                type: 'image/tiff',
            }),
            TEN_GB
        );
        const bytesRead = trackBytesRead();

        const result = await getExifInfo(file, 'image/tiff');

        expect(result?.exif?.DateTimeOriginal?.description).toBe(DATE_TIME_ORIGINAL);
        expect(bytesRead.getBytesRead()).toBeLessThanOrEqual(2 * 1024 * 1024);
    });

    it.each([
        { size: MAX_EXIF_FULL_READ_SIZE, expected: DATE_TIME_ORIGINAL },
        { size: MAX_EXIF_FULL_READ_SIZE + 1, expected: undefined },
    ])('should read EXIF data past the 1 MB head only up to 100 MB (size $size)', async ({ size, expected }) => {
        const file = withReportedSize(createPngWithExifAfterImageData(), size);

        const result = await getExifInfo(file, 'image/png');

        expect(result?.exif?.DateTimeOriginal?.description).toBe(expected);
    });

    it.each([
        { position: 'ending at 1 MB', exifChunkOffset: EXIF_HEAD_SIZE - EXIF_CHUNK_SIZE, expected: DATE_TIME_ORIGINAL },
        { position: 'starting at 1 MB', exifChunkOffset: EXIF_HEAD_SIZE, expected: undefined },
    ])(
        'should read EXIF data of an image over 100 MB only from the 1 MB head (eXIf chunk $position)',
        async ({ exifChunkOffset, expected }) => {
            const imageDataSize = exifChunkOffset - EXIF_CHUNK_OFFSET_WITHOUT_IMAGE_DATA;
            const file = withReportedSize(createPngWithExifAfterImageData(imageDataSize), MAX_EXIF_FULL_READ_SIZE + 1);

            const result = await getExifInfo(file, 'image/png');

            expect(result?.exif?.DateTimeOriginal?.description).toBe(expected);
        }
    );
});
