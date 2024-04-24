import ChunkFileReader from '../ChunkFileReader';
import { mimetypeFromExtension } from './helpers';

// Many mime-types can be detected within this range
const minimumBytesToCheck = 4100;

export async function mimeTypeFromFile(input: File) {
    const defaultType = input.type || 'application/octet-stream';

    const reader = new ChunkFileReader(input, minimumBytesToCheck);
    if (reader.isEOF()) {
        return defaultType;
    }

    return (await mimetypeFromExtension(input.name)) || defaultType;
}
