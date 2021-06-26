import { EXTRA_EXTENSION_TYPES } from './constants';

interface Options {
    /**
     * Offset in source buffer to start checking from
     */
    offset?: number;

    mask?: number[];
}

export function SignatureChecker(sourceBuffer: Buffer) {
    /**
     * Checks if source buffer, starting from offset, contains bytes in `signature`.
     * Used to check file header bytes for specific mime types.
     * @param signature - hexadecimal bytes in signature to match
     * @param options - checker options
     */
    const check = (signature: number[], { offset = 0, mask }: Options = {}) => {
        if (offset + signature.length > sourceBuffer.length) {
            return false;
        }

        for (const [index, signatureByte] of signature.entries()) {
            const sourceByte = sourceBuffer[index + offset];
            const maskedByte = mask ? signatureByte !== (mask[index] & sourceByte) : sourceByte;

            if (signatureByte !== maskedByte) {
                return false;
            }
        }

        return true;
    };

    /**
     * Checks if source buffer, starting from offset, contains bytes matching ascii characters in `signature`.
     * Used to check file header bytes for specific mime types.
     * @param signature - ascii characters to match in signature
     * @param options - checker options
     */
    const checkString = (signature: string, options?: Options) => {
        const bytes = [...signature].map((character) => character.charCodeAt(0));
        return check(bytes, options);
    };

    return {
        sourceBuffer,
        check,
        checkString,
    };
}

/**
Checks whether the TAR checksum is valid.
@param {Buffer} buffer - The TAR header `[offset ... offset + 512]`.
@param {number} offset - TAR header offset.
@returns {boolean} `true` if the TAR checksum is valid, otherwise `false`.
*/
export function isTarHeaderChecksumValid(buffer: Buffer) {
    const readSum = parseInt(buffer.toString('utf8', 148, 154).replace(/\0.*$/, '').trim(), 8); // Read sum in header

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(readSum)) {
        return false;
    }

    let sum = 8 * 0x20; // Initialize signed bit sum

    for (let i = 0; i < 148; i++) {
        sum += buffer[i];
    }

    for (let i = 156; i < 512; i++) {
        sum += buffer[i];
    }

    return readSum === sum;
}

export async function mimetypeFromExtension(filename: string) {
    const { lookup } = await import('mime-types');
    const extension = filename.split('.').pop();
    return (
        (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename) || 'application/octet-stream'
    );
}
