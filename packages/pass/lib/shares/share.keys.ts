import { api } from '@proton/pass/lib/api/api';
import { isShareRemovedError } from '@proton/pass/lib/api/errors';
import type { ShareKeyResponse } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

/* ⚠️ This endpoint is not paginated yet back-end side. */
export const getAllShareKeys = async (shareId: string): Promise<ShareKeyResponse[]> => {
    const response = await api({
        url: `pass/v1/share/${shareId}/key`,
        params: { Page: 0 },
        method: 'get',
    });

    return response.ShareKeys?.Keys ?? [];
};

export const getShareLatestEventId = async (shareId: string): Promise<string> =>
    api({
        url: `pass/v1/share/${shareId}/event`,
        method: 'get',
    })
        .then(({ EventID }) => EventID)
        .catch((err) => {
            logger.info(`[Share] Failed getting latest eventID for share ${logId(shareId)}`);
            /** Propagate share-removal so callers can clean up the share.
             * Tolerate transient errors with an empty cursor. */
            if (isShareRemovedError(err)) throw err;
            return '';
        });
