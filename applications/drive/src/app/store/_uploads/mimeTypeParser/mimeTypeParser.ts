import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import ChunkFileReader from '../ChunkFileReader';
import { mimetypeFromExtension, SignatureChecker } from './helpers';
import applicationSignatures from './signatureChecks/applicationSignatures';
import archiveSignatures from './signatureChecks/archiveSignatures';
import audioSignatures from './signatureChecks/audioSignatures';
import fontSignatures from './signatureChecks/fontSignatures';
import imageSignatures from './signatureChecks/imageSignatures';
import unsafeSignatures from './signatureChecks/unsafeSignatures';
import videoSignatures from './signatureChecks/videoSignatures';

// Many mime-types can be detected within this range
const minimumBytesToCheck = 4100;

function mimeTypeFromSignature(checker: ReturnType<typeof SignatureChecker>): SupportedMimeTypes | undefined {
    return (
        imageSignatures(checker) || // before audio
        audioSignatures(checker) || // before video
        videoSignatures(checker) || // before application
        applicationSignatures(checker) ||
        archiveSignatures(checker) ||
        fontSignatures(checker) ||
        unsafeSignatures(checker)
    );
}

export function mimeTypeFromBuffer(input: Uint8Array | ArrayBuffer | Buffer) {
    const sourceBuffer = input instanceof Buffer ? input : Buffer.from(input);

    if (sourceBuffer.length < 2) {
        return undefined;
    }

    return mimeTypeFromSignature(SignatureChecker(sourceBuffer));
}

export async function mimeTypeFromFile(input: File, extensionFallback = true) {
    const defaultType = 'application/octet-stream';

    const extension = input.name.split('.').pop();

    if (extension) {
        if (extension.toLowerCase() === 'svg') {
            return SupportedMimeTypes.svg;
        }

        /*
            .apk has the same file signature as .zip, and since  mimeTypeFromSignature has the highest
            priority later in the code, we have to check for .apk separately here.
        */
        if (extension.toLocaleLowerCase() === 'apk') {
            return SupportedMimeTypes.apk;
        }
    }

    const reader = new ChunkFileReader(input, minimumBytesToCheck);
    if (reader.isEOF()) {
        return defaultType;
    }

    const chunk = await reader.readNextChunk();
    return (
        mimeTypeFromSignature(SignatureChecker(Buffer.from(chunk))) ||
        (extensionFallback && mimetypeFromExtension(input.name)) ||
        defaultType
    );
}
