import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';
import { traceError } from '@proton/shared/lib/helpers/sentry';

export async function mimeTypeFromExtension(filename: string) {
    try {
        const { lookup } = await import(/* webpackChunkName: "mime-types" */ 'mime-types');
        const extension = getFileExtension(filename);

        return (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename);
    } catch (e) {
        traceError(e);
        return undefined;
    }
}
