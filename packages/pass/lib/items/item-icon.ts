import type { Maybe } from '../../types';
import { uint8ArrayToB64 } from '../../utils/buffer/sanitization';

/** Custom item icons are stored inline in the item's protobuf `Metadata.icon`
 * field as a base64 image data URI (no extra API request per item).
 *
 * SECURITY: items can be shared between users, so the `icon` field is
 * untrusted input. A malicious sharer could set it to an `https://` URL
 * (to track who opens the vault), to `javascript:` or to any other scheme.
 * We therefore only ever render strictly validated base64 image data URIs
 * via `getItemIconSrc`. SVGs are only rendered in an `<img>` context, where
 * they cannot execute scripts or load external resources.
 *
 * Browsers content-sniff `<img>` data URIs regardless of the declared mime
 * type, and decode rasters at their intrinsic size whatever the display size.
 * Raster icons are therefore also checked from their header bytes: the
 * format must match the declared type, must not be animated, and dimensions
 * are bounded (a ~24KB PNG can declare 14000x14000px, ie: ~780MB decoded). */

/** Raster output size in pixels (square) */
const ITEM_ICON_SIZE = 64;
/** Maximum source file size in bytes */
export const ITEM_ICON_MAX_INPUT_SIZE = 512 * 1024;
/** Maximum data URI length stored in the item */
export const ITEM_ICON_MAX_LENGTH = 32 * 1024;
/** Maximum stored raster icon dimensions. Leaves headroom over
 * `ITEM_ICON_SIZE` for icons produced by other clients. */
export const ITEM_ICON_MAX_DIMENSION = 512;
/** Maximum source image dimensions, checked from the header before decoding:
 * bounds the decoded bitmap when rasterizing (4096x4096 RGBA is 64MB) */
export const ITEM_ICON_MAX_INPUT_DIMENSION = 4096;
export const ITEM_ICON_ACCEPTED_TYPES: string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const ITEM_ICON_SVG_TYPE = 'image/svg+xml';
const ITEM_ICON_DATA_URI_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export type ItemIconErrorReason = 'type' | 'size' | 'dimensions' | 'decode';

export class ItemIconError extends Error {
    reason: ItemIconErrorReason;

    constructor(reason: ItemIconErrorReason) {
        super(`Invalid item icon [${reason}]`);
        this.name = 'ItemIconError';
        this.reason = reason;
    }
}

type RasterFormat = 'png' | 'jpeg' | 'webp';
type RasterInfo = { format: RasterFormat; width: number; height: number; animated: boolean };

const RASTER_TYPES: Record<string, RasterFormat> = { png: 'png', jpeg: 'jpeg', webp: 'webp' };
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const u16be = (b: Uint8Array<ArrayBuffer>, o: number) => (b[o] << 8) | b[o + 1];
const u16le = (b: Uint8Array<ArrayBuffer>, o: number) => b[o] | (b[o + 1] << 8);
const u24le = (b: Uint8Array<ArrayBuffer>, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
const u32be = (b: Uint8Array<ArrayBuffer>, o: number) =>
    ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u32le = (b: Uint8Array<ArrayBuffer>, o: number) => u16le(b, o) + u16le(b, o + 2) * 0x10000;
const ascii = (b: Uint8Array<ArrayBuffer>, o: number, length: number) =>
    String.fromCharCode(...b.subarray(o, o + length));

/** Walks the chunks up to the first `IDAT`: `acTL` must precede it for APNGs */
const readPNGInfo = (b: Uint8Array<ArrayBuffer>): Maybe<RasterInfo> => {
    if (b.length < 33 || ascii(b, 12, 4) !== 'IHDR') return;
    const info: RasterInfo = { format: 'png', width: u32be(b, 16), height: u32be(b, 20), animated: false };

    for (let offset = 8; offset + 8 <= b.length; offset += 12 + u32be(b, offset)) {
        const type = ascii(b, offset + 4, 4);
        if (type === 'acTL') info.animated = true;
        if (type === 'IDAT') return info;
    }
};

/** Scans the marker segments for the first start-of-frame */
const readJPEGInfo = (b: Uint8Array<ArrayBuffer>): Maybe<RasterInfo> => {
    let offset = 2;

    while (offset + 9 <= b.length) {
        if (b[offset] !== 0xff) return;
        const marker = b[offset + 1];

        /** Fill bytes and standalone markers have no length */
        if (marker === 0xff) offset += 1;
        else if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) offset += 2;
        else if (marker === 0xda) return;
        else if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            return { format: 'jpeg', width: u16be(b, offset + 7), height: u16be(b, offset + 5), animated: false };
        } else offset += 2 + u16be(b, offset + 2);
    }
};

const readWebPInfo = (b: Uint8Array<ArrayBuffer>): Maybe<RasterInfo> => {
    if (b.length < 30) return;

    switch (ascii(b, 12, 4)) {
        case 'VP8 ':
            if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return;
            return { format: 'webp', width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff, animated: false };
        case 'VP8L': {
            if (b[20] !== 0x2f) return;
            const bits = u32le(b, 21);
            return {
                format: 'webp',
                width: (bits & 0x3fff) + 1,
                height: ((bits >>> 14) & 0x3fff) + 1,
                animated: false,
            };
        }
        case 'VP8X':
            return {
                format: 'webp',
                width: u24le(b, 24) + 1,
                height: u24le(b, 27) + 1,
                animated: (b[20] & 0x02) !== 0,
            };
    }
};

/** Detects the raster format from its magic bytes (not from any declared
 * mime type) and reads the dimensions from the header without decoding */
export const readRasterInfo = (b: Uint8Array<ArrayBuffer>): Maybe<RasterInfo> => {
    if (PNG_SIGNATURE.every((byte, idx) => b[idx] === byte)) return readPNGInfo(b);
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return readJPEGInfo(b);
    if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return readWebPInfo(b);
};

const decodeB64 = (data: string): Maybe<Uint8Array<ArrayBuffer>> => {
    try {
        return Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    } catch {}
};

/** Stored raster icons must match their declared type, not be animated and fit `ITEM_ICON_MAX_DIMENSION` */
const isValidRasterIcon = (format: RasterFormat, data: string): boolean => {
    const bytes = decodeB64(data);
    const info = bytes ? readRasterInfo(bytes) : undefined;

    return (
        info !== undefined &&
        info.format === format &&
        !info.animated &&
        info.width > 0 &&
        info.height > 0 &&
        info.width <= ITEM_ICON_MAX_DIMENSION &&
        info.height <= ITEM_ICON_MAX_DIMENSION
    );
};

/** Strict check: string, <= `ITEM_ICON_MAX_LENGTH`, base64 png/jpeg/webp/svg data URI.
 * Raster payloads are further checked with `isValidRasterIcon`. */
export const isValidItemIcon = (icon: unknown): icon is string => {
    if (typeof icon !== 'string' || icon.length > ITEM_ICON_MAX_LENGTH) return false;

    const match = ITEM_ICON_DATA_URI_RE.exec(icon);
    if (!match) return false;

    const format = RASTER_TYPES[match[1]];
    return format === undefined || isValidRasterIcon(format, icon.slice(icon.indexOf(',') + 1));
};

/** Returns the icon if valid, otherwise undefined. This is the
 * ONLY way the UI should resolve an item icon to an `<img src>`. */
export const getItemIconSrc = (icon?: string): Maybe<string> => (isValidItemIcon(icon) ? icon : undefined);

/** Length of a base64 data URI for `byteLength` bytes of `type` */
const getDataURILength = (type: string, byteLength: number): number =>
    `data:${type};base64,`.length + Math.ceil(byteLength / 3) * 4;

const readFileBytes = async (file: Blob): Promise<Uint8Array<ArrayBuffer>> => {
    try {
        return new Uint8Array(await file.arrayBuffer());
    } catch {
        throw new ItemIconError('decode');
    }
};

/** `file.type` is inferred from the file extension: check the actual raster
 * format and its dimensions from the header before handing it to a decoder */
const assertRasterInput = (bytes: Uint8Array<ArrayBuffer>) => {
    const info = readRasterInfo(bytes);
    if (!info) throw new ItemIconError('type');
    if (!info.width || !info.height) throw new ItemIconError('decode');
    if (info.width > ITEM_ICON_MAX_INPUT_DIMENSION || info.height > ITEM_ICON_MAX_INPUT_DIMENSION) {
        throw new ItemIconError('dimensions');
    }
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new ItemIconError('decode'));
        img.src = src;
    });

/** Center-crops and scales the image to `ITEM_ICON_SIZE` and exports it as PNG */
const rasterizeImage = (img: HTMLImageElement): string => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) throw new ItemIconError('decode');
    if (width > ITEM_ICON_MAX_INPUT_DIMENSION || height > ITEM_ICON_MAX_INPUT_DIMENSION) {
        throw new ItemIconError('dimensions');
    }

    const canvas = document.createElement('canvas');
    canvas.width = ITEM_ICON_SIZE;
    canvas.height = ITEM_ICON_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ItemIconError('decode');

    const side = Math.min(width, height);
    const sx = (width - side) / 2;
    const sy = (height - side) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, ITEM_ICON_SIZE, ITEM_ICON_SIZE);

    return canvas.toDataURL('image/png');
};

/** Converts an image file to an item icon data URI.
 * - SVG: kept as vector (original bytes base64-encoded) once verified it loads as an `<img>`.
 * - Raster: center-cropped and scaled to `ITEM_ICON_SIZE`, exported as PNG.
 * Rejects with an `ItemIconError` on unaccepted type, oversize input/output, raster
 * dimensions over `ITEM_ICON_MAX_INPUT_DIMENSION` or decoding failure. */
export const processItemIcon = async (file: File): Promise<string> => {
    if (!ITEM_ICON_ACCEPTED_TYPES.includes(file.type)) throw new ItemIconError('type');
    if (file.size > ITEM_ICON_MAX_INPUT_SIZE) throw new ItemIconError('size');

    /** SVGs are stored as-is: fail early if the encoded data URI would be too long */
    const isSVG = file.type === ITEM_ICON_SVG_TYPE;
    if (isSVG && getDataURILength(file.type, file.size) > ITEM_ICON_MAX_LENGTH) throw new ItemIconError('size');

    const bytes = await readFileBytes(file);
    if (!isSVG) assertRasterInput(bytes);

    /** Use the file's mime type rather than any type inferred by the platform */
    const source = `data:${file.type};base64,${uint8ArrayToB64(bytes)}`;
    const img = await loadImage(source);
    const icon = isSVG ? source : rasterizeImage(img);

    if (icon.length > ITEM_ICON_MAX_LENGTH) throw new ItemIconError('size');
    if (!isValidItemIcon(icon)) throw new ItemIconError('decode');

    return icon;
};
