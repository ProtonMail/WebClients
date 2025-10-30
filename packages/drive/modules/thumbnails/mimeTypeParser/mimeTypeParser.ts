import { getRAWMimeTypeFromName } from '@proton/shared/lib/helpers/mimetype';

import { mimeTypeFromExtension } from './mimeTypeFromExtension';

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export async function mimeTypeFromFile(input: { type: string; name: string }) {
    return (
        input.type ||
        (await mimeTypeFromExtension(input.name)) ||
        getRAWMimeTypeFromName(input.name) ||
        DEFAULT_MIME_TYPE
    );
}
