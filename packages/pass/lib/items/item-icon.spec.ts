import {
    ITEM_ICON_ACCEPTED_TYPES,
    ITEM_ICON_MAX_INPUT_SIZE,
    ITEM_ICON_MAX_LENGTH,
    ItemIconError,
    getItemIconSrc,
    isValidItemIcon,
    processItemIcon,
} from './item-icon';

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SVG_B64 = btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>');

const PNG_ICON = `data:image/png;base64,${PNG_B64}`;
const SVG_ICON = `data:image/svg+xml;base64,${SVG_B64}`;
const JPEG_ICON = `data:image/jpeg;base64,${PNG_B64}`;
const WEBP_ICON = `data:image/webp;base64,${PNG_B64}`;

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
            ['no padding', 'data:image/png;base64,QUJD'],
            ['single padding', 'data:image/png;base64,QUI='],
            ['double padding', 'data:image/png;base64,QQ=='],
        ])('should accept valid %s data URI', (_, icon) => {
            expect(isValidItemIcon(icon)).toBe(true);
        });

        it('should accept data URI of exactly `ITEM_ICON_MAX_LENGTH`', () => {
            const prefix = 'data:image/png;base64,';
            const icon = prefix + 'A'.repeat(ITEM_ICON_MAX_LENGTH - prefix.length);
            expect(icon.length).toBe(ITEM_ICON_MAX_LENGTH);
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
            const prefix = 'data:image/png;base64,';
            const icon = prefix + 'A'.repeat(ITEM_ICON_MAX_LENGTH - prefix.length + 1);
            expect(isValidItemIcon(icon)).toBe(false);
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
