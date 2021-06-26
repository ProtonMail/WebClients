import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function applicationSignatures({ check, checkString }: ReturnType<typeof SignatureChecker>) {
    if (check([0x43, 0x57, 0x53]) || check([0x46, 0x57, 0x53])) {
        return SupportedMimeTypes.swf;
    }

    if (check([0x46, 0x4c, 0x56, 0x01])) {
        return SupportedMimeTypes.flv;
    }

    if (checkString('OggS')) {
        return SupportedMimeTypes.ogg;
    }

    if (checkString('%PDF')) {
        return SupportedMimeTypes.pdf;
    }

    if (checkString('{\\rtf')) {
        return SupportedMimeTypes.rtf;
    }

    if (checkString('<?xml ')) {
        return SupportedMimeTypes.xml;
    }

    return undefined;
}
