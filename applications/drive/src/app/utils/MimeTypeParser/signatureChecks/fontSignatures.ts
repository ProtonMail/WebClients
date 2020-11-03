import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function fontSignatures({ check, checkString }: ReturnType<typeof SignatureChecker>) {
    if (checkString('wOFF')) {
        return SupportedMimeTypes.woff;
    }

    if (checkString('wOF2')) {
        return SupportedMimeTypes.woff2;
    }

    if (check([0x4f, 0x54, 0x54, 0x4f, 0x00])) {
        return SupportedMimeTypes.otf;
    }

    if (
        check([0x4c, 0x50], { offset: 34 }) &&
        (check([0x00, 0x00, 0x01], { offset: 8 }) ||
            check([0x01, 0x00, 0x02], { offset: 8 }) ||
            check([0x02, 0x00, 0x02], { offset: 8 }))
    ) {
        return SupportedMimeTypes.eot;
    }

    if (check([0x00, 0x01, 0x00, 0x00, 0x00])) {
        return SupportedMimeTypes.ttf;
    }

    return undefined;
}
