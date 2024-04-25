import { mimetypeFromExtension } from './helpers';

export async function mimeTypeFromFile(input: File) {
    return input.type || (await mimetypeFromExtension(input.name)) || 'application/octet-stream';
}
