import { SupportedMimeTypes } from '../constants';
import { isTarHeaderChecksumValid, SignatureChecker } from '../helpers';

export default function archiveSignatures({ check, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (check([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
        return SupportedMimeTypes.x7zip;
    }

    if (check([0x42, 0x5a, 0x68])) {
        return SupportedMimeTypes.bzip2;
    }
    if (check([0x1f, 0x8b, 0x8])) {
        return SupportedMimeTypes.gzip;
    }

    if (check([0x41, 0x72, 0x43, 0x01])) {
        return SupportedMimeTypes.arc;
    }

    if (check([0x52, 0x61, 0x72, 0x21, 0x1a, 0x7, 0x00]) || check([0x52, 0x61, 0x72, 0x21, 0x1a, 0x7, 0x01])) {
        return SupportedMimeTypes.rar;
    }

    // Zip-based file formats, need to be checked before actual zip
    if (check([0x50, 0x4b, 0x3, 0x4])) {
        let offset = 0;

        while (offset + 30 < sourceBuffer.length) {
            const compressedSize = sourceBuffer.readUInt32LE(offset + 18);
            const uncompressedSize = sourceBuffer.readUInt32LE(offset + 22);
            const filenameLength = sourceBuffer.readUInt16LE(offset + 26);
            const extraFieldLength = sourceBuffer.readUInt16LE(offset + 28);
            offset += 30;

            const filename = sourceBuffer.slice(offset, offset + filenameLength).toString('utf-8');
            offset += extraFieldLength + filenameLength;

            if (filename.endsWith('.rels') || filename.endsWith('.xml')) {
                const type = filename.split('/')[0];
                switch (type) {
                    case 'word':
                        return SupportedMimeTypes.docx;
                    case 'ppt':
                        return SupportedMimeTypes.pptx;
                    case 'xl':
                        return SupportedMimeTypes.xlsx;
                    default:
                        break;
                }
            }

            if (filename.startsWith('xl/')) {
                return SupportedMimeTypes.xlsx;
            }

            if (filename === 'mimetype' && compressedSize === uncompressedSize) {
                const mimeType = sourceBuffer
                    .slice(offset, offset + compressedSize)
                    .toString('utf-8') as SupportedMimeTypes;

                offset += compressedSize;

                if (Object.values(SupportedMimeTypes).includes(mimeType)) {
                    return mimeType;
                }
            }

            // Try to find next header manually when current one is corrupted
            if (compressedSize === 0) {
                let nextHeaderIndex = -1;

                while (nextHeaderIndex < 0 && offset < sourceBuffer.length) {
                    nextHeaderIndex = sourceBuffer.slice(offset).indexOf('504B0304', 0, 'hex');

                    // Move position to the next header if found, go to buffer end otherwise
                    offset += nextHeaderIndex >= 0 ? nextHeaderIndex : sourceBuffer.length - offset;
                }
            } else {
                offset += compressedSize;
            }
        }

        return SupportedMimeTypes.zip;
    }

    if (
        check([0x50, 0x4b]) &&
        (sourceBuffer[2] === 0x03 || sourceBuffer[2] === 0x05 || sourceBuffer[2] === 0x07) &&
        (sourceBuffer[3] === 0x04 || sourceBuffer[3] === 0x06 || sourceBuffer[3] === 0x08)
    ) {
        return SupportedMimeTypes.zip;
    }

    if (isTarHeaderChecksumValid(sourceBuffer.slice(0, 512))) {
        return SupportedMimeTypes.tar;
    }

    return undefined;
}
