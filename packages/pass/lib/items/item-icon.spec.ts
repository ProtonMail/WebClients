import {
    ITEM_ICON_ACCEPTED_TYPES,
    ITEM_ICON_MAX_DIMENSION,
    ITEM_ICON_MAX_INPUT_DIMENSION,
    ITEM_ICON_MAX_INPUT_SIZE,
    ITEM_ICON_MAX_LENGTH,
    ItemIconError,
    getItemIconSrc,
    isValidItemIcon,
    processItemIcon,
    readRasterInfo,
} from './item-icon';

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SVG_B64 = btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>');

/** Header-only fixtures: validation never decodes pixel data (CRCs are not checked) */
const bytes = (...parts: (number[] | string)[]): number[] =>
    parts.flatMap((part) => (typeof part === 'string' ? Array.from(part, (char) => char.charCodeAt(0)) : part));

const be16 = (n: number) => [(n >>> 8) & 0xff, n & 0xff];
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const le16 = (n: number) => [n & 0xff, (n >>> 8) & 0xff];
const le24 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const le32 = (n: number) => [...le16(n & 0xffff), ...le16(n >>> 16)];

const pngChunk = (type: string, data: number[] = []) => bytes(be32(data.length), type, data, [0, 0, 0, 0]);

const png = (width: number, height: number, chunks: number[][] = []) =>
    bytes(
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        pngChunk('IHDR', bytes(be32(width), be32(height), [1, 0, 0, 0, 0])),
        ...chunks,
        pngChunk('IDAT', [0x78, 0x9c]),
        pngChunk('IEND')
    );

const jpeg = (width: number, height: number) =>
    bytes(
        [0xff, 0xd8],
        [0xff, 0xe0],
        be16(16),
        'JFIF\0',
        [1, 1, 0],
        be16(1),
        be16(1),
        [0, 0],
        [0xff, 0xdb],
        be16(3),
        [0],
        [0xff, 0xc2],
        be16(11),
        [8],
        be16(height),
        be16(width),
        [1, 1, 0x11, 0],
        [0xff, 0xda],
        be16(8),
        [1, 1, 0, 0, 0x3f, 0],
        [0xff, 0xd9]
    );

const webp = (chunk: string, data: number[]) =>
    bytes('RIFF', le32(4 + 8 + data.length), 'WEBP', chunk, le32(data.length), data);
const webpLossy = (width: number, height: number) =>
    webp('VP8 ', bytes([0, 0, 0], [0x9d, 0x01, 0x2a], le16(width), le16(height), [0, 0]));
const webpLossless = (width: number, height: number) =>
    webp('VP8L', bytes([0x2f], le32((width - 1) | ((height - 1) << 14)), [0, 0, 0, 0, 0]));
const webpExtended = (width: number, height: number, animated: boolean = false) =>
    webp('VP8X', bytes([animated ? 0x12 : 0x10, 0, 0, 0], le24(width - 1), le24(height - 1)));

const GIF = bytes(
    'GIF89a',
    le16(1),
    le16(1),
    [0x80, 0, 0, 0, 0, 0, 0, 0, 0x2c],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x44, 0x01, 0, 0x3b]
);
const BMP = bytes(
    'BM',
    le32(58),
    [0, 0, 0, 0],
    le32(54),
    le32(40),
    le32(1),
    le32(1),
    le16(1),
    le16(24),
    Array(28).fill(0)
);
const ICO = bytes([0, 0, 1, 0, 1, 0], [16, 16, 0, 0, 1, 0, 32, 0], le32(40), le32(22), Array(20).fill(0));
const TIFF = bytes('II', [42, 0], le32(8), Array(24).fill(0));
const AVIF = bytes(be32(24), 'ftypavif', be32(0), 'mif1avif', Array(8).fill(0));

const toB64 = (data: number[]) => btoa(String.fromCharCode(...data));
const toDataURI = (type: string, data: number[]) => `data:${type};base64,${toB64(data)}`;

const PNG_ICON = `data:image/png;base64,${PNG_B64}`;
const SVG_ICON = `data:image/svg+xml;base64,${SVG_B64}`;
const JPEG_ICON = toDataURI('image/jpeg', jpeg(64, 64));
const WEBP_ICON = toDataURI('image/webp', webpLossy(64, 64));

const createFile = (type: string, size: number = 16): File => {
    const file = new File(['x'], 'icon', { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

const expectIconError = async (promise: Promise<unknown>, reason: ItemIconError['reason']) => {
    const error = (await promise.catch((err: unknown) => err)) as ItemIconError;
    expect(error).toBeInstanceOf(ItemIconError);
    expect(error.reason).toBe(reason);
};

describe('item icon', () => {
    describe('isValidItemIcon', () => {
        it.each([
            ['png', PNG_ICON],
            ['svg', SVG_ICON],
            ['jpeg', JPEG_ICON],
            ['webp', WEBP_ICON],
            ['webp lossless', toDataURI('image/webp', webpLossless(64, 64))],
            ['webp extended', toDataURI('image/webp', webpExtended(64, 64))],
            ['no padding', 'data:image/svg+xml;base64,QUJD'],
            ['single padding', 'data:image/svg+xml;base64,QUI='],
            ['double padding', 'data:image/svg+xml;base64,QQ=='],
        ])('should accept valid %s data URI', (_, icon) => {
            expect(isValidItemIcon(icon)).toBe(true);
        });

        /** Largest PNG whose data URI fits: base64 grows in 4 char steps */
        const prefix = 'data:image/png;base64,';
        const maxBytes = Math.floor((ITEM_ICON_MAX_LENGTH - prefix.length) / 4) * 3;
        const paddedPNG = (byteLength: number) => {
            const base = png(1, 1, [pngChunk('tEXt')]);
            return png(1, 1, [pngChunk('tEXt', Array(byteLength - base.length).fill(0x20))]);
        };

        it('should accept data URI up to `ITEM_ICON_MAX_LENGTH`', () => {
            const icon = toDataURI('image/png', paddedPNG(maxBytes));
            expect(icon.length).toBeLessThanOrEqual(ITEM_ICON_MAX_LENGTH);
            expect(ITEM_ICON_MAX_LENGTH - icon.length).toBeLessThan(4);
            expect(isValidItemIcon(icon)).toBe(true);
        });

        it.each([
            ['https URL', 'https://tracker.example.com/pixel.png'],
            ['http URL', 'http://tracker.example.com/pixel.png'],
            ['protocol-relative URL', '//tracker.example.com/pixel.png'],
            ['javascript URI', 'javascript:alert(1)'],
            ['javascript URI with image prefix', 'javascript:data:image/png;base64,QUJD'],
            ['blob URI', 'blob:https://example.com/0000-0000'],
            ['text/html data URI', `data:text/html;base64,${btoa('<script>alert(1)</script>')}`],
            ['image/gif data URI', 'data:image/gif;base64,QUJD'],
            ['uppercase mime type', 'data:IMAGE/PNG;base64,QUJD'],
            ['non-base64 data URI', 'data:image/svg+xml,<svg onload="alert(1)"></svg>'],
            ['utf8 data URI', 'data:image/svg+xml;utf8,<svg></svg>'],
            ['extra mime parameters', 'data:image/png;charset=utf-8;base64,QUJD'],
            ['non-base64 characters', 'data:image/png;base64,QUJD<script>'],
            ['whitespace in payload', 'data:image/png;base64,QUJD QUJD'],
            ['newline in payload', 'data:image/png;base64,QUJD\nQUJD'],
            ['trailing newline', `${PNG_ICON}\n`],
            ['url-safe base64 characters', 'data:image/png;base64,QU-_QUJD'],
            ['too much padding', 'data:image/png;base64,QQ==='],
            ['padding in the middle', 'data:image/png;base64,QQ==QUJD'],
            ['empty payload', 'data:image/png;base64,'],
            ['leading whitespace', ` ${PNG_ICON}`],
            ['empty string', ''],
        ])('should reject %s', (_, icon) => {
            expect(isValidItemIcon(icon)).toBe(false);
        });

        it('should reject data URI longer than `ITEM_ICON_MAX_LENGTH`', () => {
            const icon = toDataURI('image/png', paddedPNG(maxBytes + 1));
            expect(icon.length).toBeGreaterThan(ITEM_ICON_MAX_LENGTH);
            expect(isValidItemIcon(icon)).toBe(false);
            expect(isValidItemIcon(prefix + 'A'.repeat(ITEM_ICON_MAX_LENGTH - prefix.length + 1))).toBe(false);
        });

        /** Browsers content-sniff `<img>` data URIs: the declared type alone does not
         * restrict which decoder runs, nor prevent animated icons */
        describe('raster header', () => {
            it.each([
                ['gif as png', 'image/png', GIF],
                ['bmp as png', 'image/png', BMP],
                ['ico as png', 'image/png', ICO],
                ['tiff as png', 'image/png', TIFF],
                ['avif as png', 'image/png', AVIF],
                ['svg as png', 'image/png', bytes('<svg xmlns="http://www.w3.org/2000/svg"/>')],
                ['jpeg as png', 'image/png', jpeg(64, 64)],
                ['webp as png', 'image/png', webpLossy(64, 64)],
                ['png as jpeg', 'image/jpeg', png(64, 64)],
                ['gif as jpeg', 'image/jpeg', GIF],
                ['png as webp', 'image/webp', png(64, 64)],
                ['gif as webp', 'image/webp', GIF],
            ])('should reject type confusion (%s)', (_, type, data) => {
                expect(isValidItemIcon(toDataURI(type, data))).toBe(false);
            });

            it('should reject animated png (APNG)', () => {
                const apng = png(64, 64, [pngChunk('acTL', bytes(be32(2), be32(0)))]);
                expect(isValidItemIcon(toDataURI('image/png', png(64, 64)))).toBe(true);
                expect(isValidItemIcon(toDataURI('image/png', apng))).toBe(false);
            });

            it('should reject animated webp', () => {
                expect(isValidItemIcon(toDataURI('image/webp', webpExtended(64, 64, true)))).toBe(false);
            });

            it.each([
                ['png', 'image/png', png],
                ['jpeg', 'image/jpeg', jpeg],
                ['webp lossy', 'image/webp', webpLossy],
                ['webp lossless', 'image/webp', webpLossless],
                ['webp extended', 'image/webp', webpExtended],
            ])('should bound %s dimensions to `ITEM_ICON_MAX_DIMENSION`', (_, type, make) => {
                const max = ITEM_ICON_MAX_DIMENSION;
                expect(isValidItemIcon(toDataURI(type, make(max, max)))).toBe(true);
                expect(isValidItemIcon(toDataURI(type, make(max + 1, 1)))).toBe(false);
                expect(isValidItemIcon(toDataURI(type, make(1, max + 1)))).toBe(false);
                expect(isValidItemIcon(toDataURI(type, make(14000, 14000)))).toBe(false);
            });

            it.each([
                ['png', 'image/png', png(0, 0)],
                ['jpeg', 'image/jpeg', jpeg(0, 64)],
            ])('should reject zero %s dimensions', (_, type, data) => {
                expect(isValidItemIcon(toDataURI(type, data))).toBe(false);
            });

            it.each([
                ['png signature only', 'image/png', png(1, 1).slice(0, 8)],
                ['png without IDAT', 'image/png', png(1, 1).slice(0, 33)],
                [
                    'png not starting with IHDR',
                    'image/png',
                    bytes(png(1, 1).slice(0, 8), pngChunk('IDAT', Array(20).fill(0))),
                ],
                [
                    'jpeg without frame header',
                    'image/jpeg',
                    bytes([0xff, 0xd8], [0xff, 0xe0], be16(16), Array(14).fill(0), [0xff, 0xd9]),
                ],
                [
                    'jpeg with scan before frame header',
                    'image/jpeg',
                    bytes([0xff, 0xd8], [0xff, 0xda], be16(8), Array(14).fill(0)),
                ],
                ['webp with unknown chunk', 'image/webp', webp('ALPH', Array(16).fill(0))],
                ['webp lossy without start code', 'image/webp', webp('VP8 ', Array(10).fill(0))],
                ['invalid base64 length', 'image/png', null],
            ])('should reject truncated or malformed header (%s)', (_, type, data) => {
                const icon = data ? toDataURI(type, data) : `data:${type};base64,Q`;
                expect(isValidItemIcon(icon)).toBe(false);
            });

            it('should detect the format from magic bytes regardless of mime type', () => {
                const toBytes = (data: number[]) => new Uint8Array(data);
                expect(readRasterInfo(toBytes(png(3, 4)))).toEqual({
                    format: 'png',
                    width: 3,
                    height: 4,
                    animated: false,
                });
                expect(readRasterInfo(toBytes(jpeg(3, 4)))).toEqual({
                    format: 'jpeg',
                    width: 3,
                    height: 4,
                    animated: false,
                });
                expect(readRasterInfo(toBytes(webpLossy(3, 4)))).toEqual({
                    format: 'webp',
                    width: 3,
                    height: 4,
                    animated: false,
                });
                expect(readRasterInfo(toBytes(webpLossless(3, 4)))).toEqual({
                    format: 'webp',
                    width: 3,
                    height: 4,
                    animated: false,
                });
                expect(readRasterInfo(toBytes(webpExtended(3, 4, true)))).toEqual({
                    format: 'webp',
                    width: 3,
                    height: 4,
                    animated: true,
                });
                expect(readRasterInfo(toBytes(GIF))).toBeUndefined();
                expect(readRasterInfo(toBytes(BMP))).toBeUndefined();
            });
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['number', 42],
            ['object', { toString: () => PNG_ICON }],
            ['array', [PNG_ICON]],
        ])('should reject non-string value (%s)', (_, icon) => {
            expect(isValidItemIcon(icon)).toBe(false);
        });
    });

    describe('getItemIconSrc', () => {
        it.each([PNG_ICON, SVG_ICON, JPEG_ICON, WEBP_ICON])('should return valid icon as-is', (icon) => {
            expect(getItemIconSrc(icon)).toBe(icon);
        });

        it.each([
            undefined,
            '',
            'https://tracker.example.com/pixel.png',
            'javascript:alert(1)',
            `data:text/html;base64,${btoa('<script>alert(1)</script>')}`,
            'data:image/png;base64,QUJD<script>',
            'data:image/png;base64,' + 'A'.repeat(ITEM_ICON_MAX_LENGTH),
        ])('should return undefined for invalid icon %#', (icon) => {
            expect(getItemIconSrc(icon)).toBeUndefined();
        });
    });

    describe('processItemIcon', () => {
        it('should accept png, jpeg, webp and svg', () => {
            expect(ITEM_ICON_ACCEPTED_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
        });

        it.each(['', 'image/gif', 'image/bmp', 'text/html', 'application/octet-stream', 'image/svg'])(
            'should reject unaccepted mime type "%s"',
            async (type) => {
                await expectIconError(processItemIcon(createFile(type)), 'type');
            }
        );

        it.each(ITEM_ICON_ACCEPTED_TYPES)(
            'should reject %s file larger than `ITEM_ICON_MAX_INPUT_SIZE`',
            async (type) => {
                await expectIconError(processItemIcon(createFile(type, ITEM_ICON_MAX_INPUT_SIZE + 1)), 'size');
            }
        );

        it('should check mime type before size', async () => {
            await expectIconError(processItemIcon(createFile('image/gif', ITEM_ICON_MAX_INPUT_SIZE + 1)), 'type');
        });

        it('should reject svg whose data URI would exceed `ITEM_ICON_MAX_LENGTH` before decoding', async () => {
            /** 32KB of raw svg bytes encodes to ~43KB of base64 */
            const file = createFile('image/svg+xml', ITEM_ICON_MAX_LENGTH);
            const arrayBuffer = jest.spyOn(file, 'arrayBuffer');
            await expectIconError(processItemIcon(file), 'size');
            expect(arrayBuffer).not.toHaveBeenCalled();
        });

        describe('raster input', () => {
            const OriginalImage = window.Image;
            const loaded: string[] = [];

            class MockImage {
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                naturalWidth = 5000;
                naturalHeight = 5000;
                set src(src: string) {
                    loaded.push(src);
                    setTimeout(() => this.onload?.(), 0);
                }
            }

            beforeEach(() => {
                loaded.length = 0;
                window.Image = MockImage as unknown as typeof Image;
            });

            afterEach(() => {
                window.Image = OriginalImage;
            });

            const rasterFile = (data: number[], type: string = 'image/png') =>
                new File([new Uint8Array(data)], 'icon', { type });

            it('should reject dimensions over `ITEM_ICON_MAX_INPUT_DIMENSION` before decoding', async () => {
                const max = ITEM_ICON_MAX_INPUT_DIMENSION;
                await expectIconError(processItemIcon(rasterFile(png(40000, 40000))), 'dimensions');
                await expectIconError(processItemIcon(rasterFile(png(max + 1, 1))), 'dimensions');
                await expectIconError(processItemIcon(rasterFile(jpeg(1, max + 1), 'image/jpeg')), 'dimensions');
                await expectIconError(
                    processItemIcon(rasterFile(webpLossless(16384, 16384), 'image/webp')),
                    'dimensions'
                );
                expect(loaded).toHaveLength(0);
            });

            it.each([
                ['gif', GIF],
                ['bmp', BMP],
                ['svg', bytes('<svg xmlns="http://www.w3.org/2000/svg"/>')],
            ])('should reject %s bytes with a raster mime type before decoding', async (_, data) => {
                await expectIconError(processItemIcon(rasterFile(data)), 'type');
                expect(loaded).toHaveLength(0);
            });

            it('should accept a raster format differing from the mime type as it is rasterized', async () => {
                /** 5000px decoded bitmap: rejected by the post-decode bound */
                await expectIconError(processItemIcon(rasterFile(jpeg(64, 64), 'image/png')), 'dimensions');
                expect(loaded).toHaveLength(1);
                expect(loaded[0].startsWith('data:image/png;base64,')).toBe(true);
            });

            it('should bound the decoded dimensions before drawing', async () => {
                const max = ITEM_ICON_MAX_INPUT_DIMENSION;
                await expectIconError(processItemIcon(rasterFile(png(max, max))), 'dimensions');
                expect(loaded).toHaveLength(1);
            });
        });

        it('should reject with `decode` if the image cannot be loaded', async () => {
            const OriginalImage = window.Image;

            class FailingImage {
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                set src(_: string) {
                    setTimeout(() => this.onerror?.(), 0);
                }
            }

            window.Image = FailingImage as unknown as typeof Image;

            try {
                const file = new File([atob(SVG_B64)], 'icon.svg', { type: 'image/svg+xml' });
                await expectIconError(processItemIcon(file), 'decode');
            } finally {
                window.Image = OriginalImage;
            }
        });

        it('should keep svg as vector data URI', async () => {
            const OriginalImage = window.Image;

            class LoadingImage {
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                naturalWidth = 1;
                naturalHeight = 1;
                set src(_: string) {
                    setTimeout(() => this.onload?.(), 0);
                }
            }

            window.Image = LoadingImage as unknown as typeof Image;

            try {
                const file = new File([atob(SVG_B64)], 'icon.svg', { type: 'image/svg+xml' });
                await expect(processItemIcon(file)).resolves.toBe(SVG_ICON);
            } finally {
                window.Image = OriginalImage;
            }
        });
    });
});
