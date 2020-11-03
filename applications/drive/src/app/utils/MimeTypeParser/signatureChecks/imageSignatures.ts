import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function imageSignatures({ check, checkString, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (checkString('WEBP', { offset: 8 })) {
        return SupportedMimeTypes.webp;
    }

    if (check([0x4d, 0x4d, 0x0, 0x2a]) || check([0x49, 0x49, 0x2a, 0x0])) {
        return SupportedMimeTypes.tiff;
    }

    if (check([0x47, 0x49, 0x46])) {
        return SupportedMimeTypes.gif;
    }

    if (check([0xff, 0xd8, 0xff])) {
        return SupportedMimeTypes.jpg;
    }

    if (check([0x42, 0x4d])) {
        return SupportedMimeTypes.bmp;
    }

    if (checkString('ftyp', { offset: 4 }) && (sourceBuffer[8] & 0x60) !== 0x00) {
        const brandMajor = sourceBuffer.toString('binary', 8, 12).replace('\0', ' ').trim();
        switch (brandMajor) {
            case 'avif':
                return SupportedMimeTypes.avif;
            case 'mif1':
                return SupportedMimeTypes.heif;
            case 'msf1':
                return SupportedMimeTypes.heifs;
            case 'heic':
            case 'heix':
                return SupportedMimeTypes.heic;
            case 'hevc':
            case 'hevx':
                return SupportedMimeTypes.heics;
            case 'crx':
                return SupportedMimeTypes.cr3;
            default:
                return undefined;
        }
    }

    if (check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        let offset = 8; // start after png header

        do {
            // Read 4-byte uint data length block
            const dataLength = sourceBuffer.slice(offset, offset + 4).readInt32BE(0);
            offset += 4;

            if (dataLength < 0) {
                return;
            }

            // Read 4 -byte chunk type block
            const chunkType = sourceBuffer.slice(offset, offset + 4).toString('binary');
            offset += 4;

            // if acTL comes first, it's animated png, otherwise static
            switch (chunkType) {
                case 'IDAT':
                    return SupportedMimeTypes.png;
                case 'acTL':
                    return SupportedMimeTypes.apng;
                default:
                    offset += dataLength + 4; // ignore data + CRC
            }
        } while (offset + 8 < sourceBuffer.length);

        return SupportedMimeTypes.png;
    }

    return undefined;
}
