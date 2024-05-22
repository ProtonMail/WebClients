import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';

import { sendErrorReport } from '../../../utils/errorHandling';
import { getWebpackChunkFailedToLoadError } from '../../../utils/errorHandling/WebpackChunkFailedToLoadError';

export async function mimetypeFromExtension(filename: string) {
    const { lookup } = await import(/* webpackChunkName: "mime-types" */ 'mime-types').catch((e) => {
        const report = getWebpackChunkFailedToLoadError(e, 'mime-types');
        console.warn(report);
        sendErrorReport(report);
        return Promise.reject(report);
    });
    const extension = filename.split('.').pop();

    return (
        (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename) || 'application/octet-stream'
    );
}
