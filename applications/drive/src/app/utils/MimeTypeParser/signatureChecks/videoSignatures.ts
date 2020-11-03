import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function videoSignatures({ check, checkString, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (check([0x52, 0x49, 0x46, 0x46]) && check([0x41, 0x56, 0x49], { offset: 8 })) {
        return SupportedMimeTypes.avi;
    }

    if (
        checkString('OggS') &&
        (check([0x80, 0x74, 0x68, 0x65, 0x6f, 0x72, 0x61], { offset: 28 }) ||
            check([0x01, 0x76, 0x69, 0x64, 0x65, 0x6f, 0x00], { offset: 28 }))
    ) {
        return SupportedMimeTypes.ogv;
    }

    if (check([0x00, 0x00, 0x01, 0xba])) {
        if (check([0x21], { offset: 4, mask: [0xf1] })) {
            return SupportedMimeTypes.mp1s;
        }
        if (check([0x44], { offset: 4, mask: [0xc4] })) {
            return SupportedMimeTypes.mp2p;
        }
    }

    if (
        check([0x66, 0x72, 0x65, 0x65], { offset: 4 }) ||
        check([0x6d, 0x64, 0x61, 0x74], { offset: 4 }) ||
        check([0x6d, 0x6f, 0x6f, 0x76], { offset: 4 }) ||
        check([0x77, 0x69, 0x64, 0x65], { offset: 4 })
    ) {
        return SupportedMimeTypes.qt;
    }

    if (checkString('ftyp', { offset: 4 }) && (sourceBuffer[8] & 0x60) !== 0x00) {
        const brandMajor = sourceBuffer.toString('binary', 8, 12).replace('\0', ' ').trim();
        switch (brandMajor) {
            case 'qt':
                return SupportedMimeTypes.qt;
            case 'M4V':
            case 'M4VH':
            case 'M4VP':
                return SupportedMimeTypes.m4v;
            case 'M4P':
            case 'F4V':
            case 'F4P':
                return SupportedMimeTypes.mp4v;
            default:
                if (brandMajor.startsWith('3g')) {
                    if (brandMajor.startsWith('3g2')) {
                        return SupportedMimeTypes.v3g2;
                    }
                    return SupportedMimeTypes.v3gp;
                }
                return SupportedMimeTypes.mp4v;
        }
    }

    return undefined;
}
