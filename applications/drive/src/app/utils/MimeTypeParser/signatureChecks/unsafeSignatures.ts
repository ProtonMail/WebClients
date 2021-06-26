import { SupportedMimeTypes } from '../constants';
import { SignatureChecker } from '../helpers';

export default function unsafeSignatures({ check, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (check([0x00, 0x00, 0x01, 0x00]) || check([0x00, 0x00, 0x02, 0x00])) {
        return SupportedMimeTypes.ico;
    }

    if (check([0x0, 0x0, 0x1, 0xba]) || check([0x0, 0x0, 0x1, 0xb3])) {
        return SupportedMimeTypes.mpg;
    }

    // Every 188th byte is sync byte, which is a reasonable guess
    let isMp2t = true;
    for (let offset = 0; offset < sourceBuffer.length; offset += 188) {
        if (!check([0x47], { offset })) {
            isMp2t = false;
            break;
        }
    }
    if (isMp2t) {
        return SupportedMimeTypes.mp2t;
    }

    // Check for MPEG header at different starting offsets
    for (let start = 0; start < 2 && start < sourceBuffer.length - 16; start++) {
        // Check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE)
        if (sourceBuffer.length >= start + 2 && check([0xff, 0xe0], { offset: start, mask: [0xff, 0xe0] })) {
            if (check([0x10], { offset: start + 1, mask: [0x16] })) {
                return SupportedMimeTypes.aac;
            }
            // mp3, mp2 or mp1
            if (
                check([0x02], { offset: start + 1, mask: [0x06] }) ||
                check([0x04], { offset: start + 1, mask: [0x06] }) ||
                check([0x06], { offset: start + 1, mask: [0x06] })
            ) {
                return SupportedMimeTypes.mpeg;
            }
        }
    }

    return undefined;
}
