import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';

export async function mimetypeFromExtension(filename: string) {
    const { lookup } = await import(/* webpackChunkName: "mime-types" */ 'mime-types');
    const extension = filename.split('.').pop();
    return (
        (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename) || 'application/octet-stream'
    );
}
