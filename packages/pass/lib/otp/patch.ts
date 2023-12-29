import { Secret } from 'otpauth';

export const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32ToBuf = (str: string) => {
    let end = str.length;
    while (str[end - 1] === '=') --end;

    const cstr = (end < str.length ? str.substring(0, end) : str).toUpperCase();
    if (cstr.length === 0) throw new TypeError('Empty secret');

    /** PATCH: Ensure that the buffer size is at least 1 byte even for single-character inputs.
     * Base32 encoding and decoding involve packing and unpacking groups of characters into bytes.
     * In the original `otpauth` lib, the buffer size ((cstr.length * 5) / 8) | 0) might result in 0
     * for inputs with fewer than 8 bits. However, the minimum buffer size required for any data
     * is 1 byte. Therefore, we use Math.max(1, ...) to ensure a minimum buffer size of 1 byte.
     * This guarantees that the buffer has sufficient capacity for at least one byte, even when
     * processing single-character inputs, preventing issues with zero-sized buffers.
     * see: `https://github.com/hectorm/otpauth/blob/acbfad3f9492adb5bfa8c2cca1371e880aaa0400/src/utils/encoding/base32.js#L47` */
    const bufSize = Math.max(1, ((cstr.length * 5) / 8) | 0);
    const buf = new ArrayBuffer(bufSize);

    const arr = new Uint8Array(buf);

    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < cstr.length; i++) {
        const idx = B32_ALPHABET.indexOf(cstr[i]);
        if (idx === -1) throw new TypeError(`Invalid character found: ${cstr[i]}`);

        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
            bits -= 8;
            arr[index++] = value >>> bits;
        }
    }

    /* At this stage we may have remaining bits to process but depending
     * on the base32 implementation this could lead to different results.
     * Pass mobile apps are not handling these trailing bits. */

    return buf;
};

/**
 * Extends the base `otpauth` class `Secret` with a patch to handle base32 encoding edge-cases.
 * This patch is designed to retain the initial base32 secret when rebuilding the OTP URL.
 * It ensures that a single character, such as 'A', is not unintentionally converted to 'AA'
 * due to missing bits during encoding and decoding processes.
 */
export class PatchedSecret extends Secret {
    private initialBase32Secret: string | undefined;

    public setInitialBase32Secret(str: string) {
        this.initialBase32Secret = str.toUpperCase();
    }

    get base32() {
        return this.initialBase32Secret ?? super.base32;
    }
}

Secret.fromBase32 = (str: string) => {
    const instance = new PatchedSecret({ buffer: base32ToBuf(str) });
    instance.setInitialBase32Secret(str);
    return instance;
};
