import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';

import retryOnError from '../../../utils/retryOnError';
import { PAGE_SIZE, SESSION_EXPIRED_ERROR_CODE } from '../constants';
import { Session } from '../types';
import { getDefaultSessionValue } from '../utils';
import { FetchShareMap } from './useFetchShareMap';

export const fetchItemsMetadataPage = async (
    shareId: string,
    fetchShareMap: FetchShareMap,
    sessionName?: Session['sessionName'],
    page?: number
): Promise<{
    links: ShareMapLink[];
    session: Session;
}> => {
    return retryOnError<{
        links: ShareMapLink[];
        session: Session;
    }>({
        fn: async (sessionName: Session['sessionName'], page?: number) => {
            const lastIndex = page === undefined ? undefined : page * PAGE_SIZE + 1;
            const { Links, SessionName, More, Total } = await fetchShareMap({
                shareId,
                lastIndex,
                sessionName,
                pageSize: PAGE_SIZE,
            });

            return {
                links: Links,
                session: {
                    sessionName: SessionName,
                    isDone: More === 0,
                    total: Total,
                },
            };
        },
        shouldRetryBasedOnError: (error) => {
            const apiError = getApiError(error);
            if (apiError.code === SESSION_EXPIRED_ERROR_CODE) {
                return true;
            }

            console.warn(error);
            return false;
        },
        beforeRetryCallback: async () => {
            return [getDefaultSessionValue()];
        },
        maxRetriesNumber: 2,
    })(sessionName, page);
};
