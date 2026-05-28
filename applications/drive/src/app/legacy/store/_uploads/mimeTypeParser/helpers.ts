import { getWebpackChunkFailedToLoadError, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

export async function mimetypeFromExtension(filename: string) {
    const { lookup } = await import(/* webpackChunkName: "mime-types" */ 'mime-types').catch((e) => {
        const report = getWebpackChunkFailedToLoadError(e, 'mime-types');
        console.warn(report);
        sendErrorReport(report);
        return Promise.reject(report);
    });
    const extension = getFileExtension(filename);

    return (
        (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename) || 'application/octet-stream'
    );
}
