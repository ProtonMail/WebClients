import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';
import { getFileExtension, getRAWMimeTypeFromName } from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { getWebpackChunkFailedToLoadError } from '../../../utils/errorHandling/WebpackChunkFailedToLoadError';

async function mediaTypeFromExtension(filename: string) {
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

export async function mediaTypeFromFile(file: File) {
    // TODO: Improve error catching and put default type inside a constant
    return (
        file.type ||
        (await mediaTypeFromExtension(file.name).catch(() => 'application/octet-stream')) ||
        getRAWMimeTypeFromName(file.name) ||
        'application/octet-stream'
    );
}
