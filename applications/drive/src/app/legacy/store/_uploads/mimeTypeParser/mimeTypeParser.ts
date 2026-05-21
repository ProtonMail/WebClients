import { getRAWMimeTypeFromName } from '@proton/shared/lib/helpers/mimetype';

import { mimetypeFromExtension } from './helpers';

export async function mimeTypeFromFile(input: File) {
    return (
        input.type ||
        (await mimetypeFromExtension(input.name)) ||
        getRAWMimeTypeFromName(input.name) ||
        'application/octet-stream'
    );
}
