import { withTimeout } from '@proton/meet/utils/withTimeout';

import {
    BACKGROUND_IMAGE_DECODE_TIMEOUT_MS,
    BACKGROUND_SIGNATURE_BYTES,
    MAX_BACKGROUND_IMAGE_EDGE,
    MAX_BACKGROUND_IMAGE_PIXELS,
    MAX_BACKGROUND_NAME_LENGTH,
    MAX_BACKGROUND_SIZE_BYTES,
} from './constants';

export type BackgroundRejectionReason =
    'empty' | 'fileTooLarge' | 'nameTooLong' | 'unsupportedType' | 'undecodable' | 'imageTooLarge';

export class InvalidBackgroundError extends Error {
    readonly reason: BackgroundRejectionReason;

    constructor(reason: BackgroundRejectionReason, message?: string) {
        super(message ?? reason);

        this.name = 'InvalidBackgroundError';
        this.reason = reason;
    }
}

const matchesAt = (bytes: Uint8Array<ArrayBuffer>, offset: number, signature: number[]): boolean =>
    bytes.length >= offset + signature.length && signature.every((byte, index) => bytes[offset + index] === byte);

const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

const BACKGROUND_SIGNATURES: { mediaType: string; matches: (bytes: Uint8Array<ArrayBuffer>) => boolean }[] = [
    {
        mediaType: 'image/jpeg',
        matches: (bytes) => matchesAt(bytes, 0, [0xff, 0xd8, 0xff]),
    },
    {
        mediaType: 'image/png',
        matches: (bytes) => matchesAt(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    },
    {
        mediaType: 'image/webp',
        matches: (bytes) => matchesAt(bytes, 0, ascii('RIFF')) && matchesAt(bytes, 8, ascii('WEBP')),
    },
];

export const sniffBackgroundMediaType = (bytes: Uint8Array<ArrayBuffer>): string | undefined =>
    BACKGROUND_SIGNATURES.find(({ matches }) => matches(bytes))?.mediaType;

interface ImageSize {
    width: number;
    height: number;
}

const measureWithImageBitmap = async (blob: Blob): Promise<ImageSize> => {
    const bitmap = await createImageBitmap(blob);

    try {
        return { width: bitmap.width, height: bitmap.height };
    } finally {
        bitmap.close();
    }
};

/** A signature can be forged over arbitrary content; a decode that yields dimensions cannot. */
const measureImage = async (blob: Blob): Promise<ImageSize> => {
    try {
        return await withTimeout(
            measureWithImageBitmap(blob),
            'Decoding the background image',
            BACKGROUND_IMAGE_DECODE_TIMEOUT_MS
        );
    } catch {
        throw new InvalidBackgroundError('undecodable', 'The image could not be decoded');
    }
};

const BACKGROUND_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

/** Browsers strip the directory from `File.name`, but the name is still a Drive filename. */
export const sanitizeBackgroundName = (name: string, mediaType: string): string => {
    const sanitized = name.replace(/[\u0000-\u001f\u007f/\\]/g, '').trim();

    if (!sanitized || /^\.+$/.test(sanitized)) {
        return `background.${BACKGROUND_EXTENSIONS[mediaType] ?? 'img'}`;
    }

    return sanitized;
};

/** Resolves with the media type sniffed from the content, which is safe to store and to mint a blob URL with. */
export const validateBackgroundFile = async (file: File): Promise<string> => {
    if (file.name.length > MAX_BACKGROUND_NAME_LENGTH) {
        throw new InvalidBackgroundError('nameTooLong', `The name is ${file.name.length} characters`);
    }

    if (!file.size) {
        throw new InvalidBackgroundError('empty', 'The file is empty');
    }

    if (file.size > MAX_BACKGROUND_SIZE_BYTES) {
        throw new InvalidBackgroundError('fileTooLarge', `The file is ${file.size} bytes`);
    }

    const header = new Uint8Array(await file.slice(0, BACKGROUND_SIGNATURE_BYTES).arrayBuffer());
    const mediaType = sniffBackgroundMediaType(header);

    if (!mediaType) {
        throw new InvalidBackgroundError('unsupportedType', 'The content matches no supported image signature');
    }

    const { width, height } = await measureImage(file);

    if (!width || !height) {
        throw new InvalidBackgroundError('undecodable', 'The image decoded to no pixels');
    }

    if (
        width > MAX_BACKGROUND_IMAGE_EDGE ||
        height > MAX_BACKGROUND_IMAGE_EDGE ||
        width * height > MAX_BACKGROUND_IMAGE_PIXELS
    ) {
        throw new InvalidBackgroundError('imageTooLarge', `The image is ${width}x${height}`);
    }

    return mediaType;
};
