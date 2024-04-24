import { EXTRA_EXTENSION_TYPES } from '@proton/shared/lib/drive/constants';

import { sendErrorReport } from '../../../utils/errorHandling';
import { getRefreshError } from '../../../utils/errorHandling/RefreshError';

export async function mimetypeFromExtension(filename: string) {
    const { lookup } = await import(/* webpackChunkName: "mime-types" */ 'mime-types').catch((e) => {
        console.warn(e);
        sendErrorReport(e);

        return Promise.reject(getRefreshError());
    });
    const extension = filename.split('.').pop();

    return (
        (extension && EXTRA_EXTENSION_TYPES[extension.toLowerCase()]) || lookup(filename) || 'application/octet-stream'
    );
}
