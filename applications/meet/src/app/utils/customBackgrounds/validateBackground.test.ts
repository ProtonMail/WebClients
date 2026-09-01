import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    BACKGROUND_IMAGE_DECODE_TIMEOUT_MS,
    MAX_BACKGROUND_IMAGE_EDGE,
    MAX_BACKGROUND_NAME_LENGTH,
    MAX_BACKGROUND_SIZE_BYTES,
} from './constants';
import { sanitizeBackgroundName, sniffBackgroundMediaType, validateBackgroundFile } from './validateBackground';

const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [...ascii('RIFF'), 0x2c, 0x00, 0x00, 0x00, ...ascii('WEBP'), ...ascii('VP8 ')];
const GIF = ascii('GIF89a');
const SVG = ascii('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');

const bytesOf = (signature: number[], padding = 64) => new Uint8Array([...signature, ...new Array(padding).fill(0x00)]);

const fileOf = (signature: number[], { name = 'beach.png', type = 'image/png' } = {}) =>
    new File([bytesOf(signature)], name, { type });

const stubDecode = (outcome: { width: number; height: number } | Error | 'never' = { width: 1920, height: 1080 }) => {
    vi.stubGlobal(
        'createImageBitmap',
        vi.fn(() => {
            if (outcome === 'never') {
                return new Promise(() => {});
            }

            if (outcome instanceof Error) {
                return Promise.reject(outcome);
            }

            return Promise.resolve({ ...outcome, close: vi.fn() });
        })
    );
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('sniffBackgroundMediaType', () => {
    it.each([
        ['JPEG', JPEG, 'image/jpeg'],
        ['PNG', PNG, 'image/png'],
        ['WebP', WEBP, 'image/webp'],
    ])('recognises %s from its signature', (_label, signature, expected) => {
        expect(sniffBackgroundMediaType(bytesOf(signature))).toBe(expected);
    });

    it.each([
        ['an SVG, which carries script', SVG],
        ['a GIF, which is not on the allowlist', GIF],
        ['an HTML document', ascii('<!DOCTYPE html>')],
        ['a RIFF container that is not WebP', [...ascii('RIFF'), 0, 0, 0, 0, ...ascii('AVI ')]],
        ['a PNG signature that is one byte off', [0x89, 0x50, 0x4e, 0x48, 0x0d, 0x0a, 0x1a, 0x0a]],
        ['nothing at all', []],
    ])('does not recognise %s', (_label, signature) => {
        expect(sniffBackgroundMediaType(bytesOf(signature, 0))).toBeUndefined();
    });

    it('does not recognise a signature that is cut short', () => {
        expect(sniffBackgroundMediaType(new Uint8Array(PNG.slice(0, 4)))).toBeUndefined();
    });
});

describe('validateBackgroundFile', () => {
    it('returns the sniffed media type', async () => {
        stubDecode();

        await expect(validateBackgroundFile(fileOf(WEBP, { name: 'beach.webp', type: 'image/webp' }))).resolves.toBe(
            'image/webp'
        );
    });

    it('trusts the content over a declared type that disagrees with it', async () => {
        stubDecode();

        await expect(validateBackgroundFile(fileOf(JPEG, { name: 'beach.png', type: 'image/png' }))).resolves.toBe(
            'image/jpeg'
        );
    });

    it('rejects content that matches no supported signature, whatever it claims to be', async () => {
        stubDecode();

        await expect(
            validateBackgroundFile(fileOf(SVG, { name: 'beach.png', type: 'image/png' }))
        ).rejects.toMatchObject({ reason: 'unsupportedType' });
    });

    it('rejects an empty file', async () => {
        await expect(validateBackgroundFile(new File([], 'beach.png', { type: 'image/png' }))).rejects.toMatchObject({
            reason: 'empty',
        });
    });

    it('rejects a file over the size limit without reading it', async () => {
        const oversized = new File([new Uint8Array(MAX_BACKGROUND_SIZE_BYTES + 1)], 'beach.png');

        await expect(validateBackgroundFile(oversized)).rejects.toMatchObject({ reason: 'fileTooLarge' });
    });

    it('rejects a name longer than the limit', async () => {
        const name = `${'a'.repeat(MAX_BACKGROUND_NAME_LENGTH)}.png`;

        await expect(validateBackgroundFile(fileOf(PNG, { name }))).rejects.toMatchObject({ reason: 'nameTooLong' });
    });

    it.each([
        ['bytes that carry a valid signature but do not decode', new Error('Decode failed'), 'undecodable'],
        ['an image that decodes to no pixels', { width: 0, height: 0 }, 'undecodable'],
        [
            'an image with an edge over the limit',
            { width: MAX_BACKGROUND_IMAGE_EDGE + 1, height: 1080 },
            'imageTooLarge',
        ],
        [
            'a decompression bomb that stays within the edge limit',
            { width: MAX_BACKGROUND_IMAGE_EDGE, height: MAX_BACKGROUND_IMAGE_EDGE },
            'imageTooLarge',
        ],
    ])('rejects %s', async (_label, outcome, reason) => {
        stubDecode(outcome);

        await expect(validateBackgroundFile(fileOf(PNG))).rejects.toMatchObject({ reason });
    });

    it('rejects a decode that never finishes', async () => {
        vi.useFakeTimers();
        stubDecode('never');

        const validation = validateBackgroundFile(fileOf(PNG));
        const rejection = expect(validation).rejects.toMatchObject({ reason: 'undecodable' });

        await vi.advanceTimersByTimeAsync(BACKGROUND_IMAGE_DECODE_TIMEOUT_MS);
        await rejection;
    });
});

describe('sanitizeBackgroundName', () => {
    it('keeps a name that needs nothing done to it', () => {
        expect(sanitizeBackgroundName('beach holiday.jpg', 'image/jpeg')).toBe('beach holiday.jpg');
    });

    it.each([
        ['a path separator', 'etc/passwd.png', 'etcpasswd.png'],
        ['a Windows separator', 'etc\\passwd.png', 'etcpasswd.png'],
        ['a null byte', 'passwd\u0000.png', 'passwd.png'],
        ['a newline', 'passwd\n.png', 'passwd.png'],
    ])('strips %s', (_label, name, expected) => {
        expect(sanitizeBackgroundName(name, 'image/png')).toBe(expected);
    });

    it.each([
        ['is empty', ''],
        ['is only separators', '/'],
        ['is a relative path', '..'],
        ['is only whitespace', '   '],
    ])('falls back to a name of its own when the name %s', (_label, name) => {
        expect(sanitizeBackgroundName(name, 'image/webp')).toBe('background.webp');
    });
});
