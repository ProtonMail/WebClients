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
 * they cannot execute scripts or load external resources. */

/** Raster output size in pixels (square) */
const ITEM_ICON_SIZE = 64;
/** Maximum source file size in bytes */
export const ITEM_ICON_MAX_INPUT_SIZE = 512 * 1024;
/** Maximum data URI length stored in the item */
export const ITEM_ICON_MAX_LENGTH = 32 * 1024;
export const ITEM_ICON_ACCEPTED_TYPES: string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const ITEM_ICON_SVG_TYPE = 'image/svg+xml';
const ITEM_ICON_DATA_URI_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export type ItemIconErrorReason = 'type' | 'size' | 'decode';

export class ItemIconError extends Error {
    reason: ItemIconErrorReason;

    constructor(reason: ItemIconErrorReason) {
        super(`Invalid item icon [${reason}]`);
        this.name = 'ItemIconError';
        this.reason = reason;
    }
}

/** Strict check: string, <= `ITEM_ICON_MAX_LENGTH`, base64 png/jpeg/webp/svg data URI */
export const isValidItemIcon = (icon: unknown): icon is string =>
    typeof icon === 'string' && icon.length <= ITEM_ICON_MAX_LENGTH && ITEM_ICON_DATA_URI_RE.test(icon);

/** Returns the icon if valid, otherwise undefined. This is the
 * ONLY way the UI should resolve an item icon to an `<img src>`. */
export const getItemIconSrc = (icon?: string): Maybe<string> => (isValidItemIcon(icon) ? icon : undefined);

/** Length of a base64 data URI for `byteLength` bytes of `type` */
const getDataURILength = (type: string, byteLength: number): number =>
    `data:${type};base64,`.length + Math.ceil(byteLength / 3) * 4;

/** Reads the file as a base64 data URI using the provided mime type
 * rather than relying on any mime type inferred by the platform. */
const readFileAsDataURI = async (file: Blob, type: string): Promise<string> => {
    try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        return `data:${type};base64,${uint8ArrayToB64(buffer)}`;
    } catch {
        throw new ItemIconError('decode');
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
 * Rejects with an `ItemIconError` on unaccepted type, oversize input/output or decoding failure. */
export const processItemIcon = async (file: File): Promise<string> => {
    if (!ITEM_ICON_ACCEPTED_TYPES.includes(file.type)) throw new ItemIconError('type');
    if (file.size > ITEM_ICON_MAX_INPUT_SIZE) throw new ItemIconError('size');

    /** SVGs are stored as-is: fail early if the encoded data URI would be too long */
    const isSVG = file.type === ITEM_ICON_SVG_TYPE;
    if (isSVG && getDataURILength(file.type, file.size) > ITEM_ICON_MAX_LENGTH) throw new ItemIconError('size');

    const source = await readFileAsDataURI(file, file.type);
    const img = await loadImage(source);
    const icon = isSVG ? source : rasterizeImage(img);

    if (icon.length > ITEM_ICON_MAX_LENGTH) throw new ItemIconError('size');
    if (!isValidItemIcon(icon)) throw new ItemIconError('decode');

    return icon;
};
