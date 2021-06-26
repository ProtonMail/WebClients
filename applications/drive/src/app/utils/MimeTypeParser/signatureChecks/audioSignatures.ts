import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function audioSignatures({ check, checkString, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (checkString('MThd')) {
        return SupportedMimeTypes.midi;
    }

    if (checkString('fLaC')) {
        return SupportedMimeTypes.flac;
    }

    if (check([0x52, 0x49, 0x46, 0x46])) {
        if (check([0x57, 0x41, 0x56, 0x45], { offset: 8 })) {
            return SupportedMimeTypes.wav;
        }

        if (check([0x51, 0x4c, 0x43, 0x4d], { offset: 8 })) {
            return SupportedMimeTypes.qcp;
        }
    }

    if (checkString('OggS')) {
        if (check([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], { offset: 28 })) {
            return SupportedMimeTypes.opus;
        }

        if (
            check([0x7f, 0x46, 0x4c, 0x41, 0x43], { offset: 28 }) ||
            check([0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20], { offset: 28 }) ||
            check([0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73], { offset: 28 })
        ) {
            return SupportedMimeTypes.oga;
        }
    }

    if (checkString('ftyp', { offset: 4 }) && (sourceBuffer[8] & 0x60) !== 0x00) {
        const brandMajor = sourceBuffer.toString('binary', 8, 12).replace('\0', ' ').trim();
        switch (brandMajor) {
            case 'M4A':
                return SupportedMimeTypes.m4a;
            case 'M4B':
            case 'F4A':
            case 'F4B':
                return SupportedMimeTypes.mp4a;
            default:
                return undefined;
        }
    }

    return undefined;
}
