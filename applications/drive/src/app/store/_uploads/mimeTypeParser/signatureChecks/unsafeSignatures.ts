import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';

// https://en.wikipedia.org/wiki/MPEG_transport_stream
const MP2T_CHUNK_SIZE = 188;

export default function unsafeSignatures({ check, sourceBuffer }: ReturnType<typeof SignatureChecker>) {
    if (check([0x00, 0x00, 0x01, 0x00]) || check([0x00, 0x00, 0x02, 0x00])) {
        return SupportedMimeTypes.ico;
    }

    if (check([0x0, 0x0, 0x1, 0xba]) || check([0x0, 0x0, 0x1, 0xb3])) {
        return SupportedMimeTypes.mpg;
    }

    // Every 188th byte is sync byte, which is a reasonable guess
    // Since 0x47 is ASCII char 'G', any text file starting with a 'G' and being smaller than 188 bytes would fulfill
    // simply checking every 188th character. I assume any mp2t file will be at least 4 blocks long. Still not perfect,
    // but seems like a reasonable solution.
    let isMp2t = sourceBuffer.byteLength >= MP2T_CHUNK_SIZE * 4;
    for (let offset = 0; isMp2t && offset < sourceBuffer.byteLength; offset += MP2T_CHUNK_SIZE) {
        isMp2t = check([0x47], { offset });
    }
    if (isMp2t) {
        return SupportedMimeTypes.mp2t;
    }

    // TODO: Check why MPEG not working
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
