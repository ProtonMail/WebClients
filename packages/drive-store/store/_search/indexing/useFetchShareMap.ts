import { useCallback } from 'react';

import { queryShareMap } from '@proton/shared/lib/api/drive/link';
import { ShareMapPayload } from '@proton/shared/lib/interfaces/drive/link';

import { useDebouncedRequest } from '../../_api';

interface ShareMapParams {
    shareId: string;
    lastIndex?: number;
    sessionName?: string;
    pageSize?: number;
}

export type FetchShareMap = (params: ShareMapParams, signal?: AbortSignal) => Promise<ShareMapPayload>;

export default function useFetchShareMap() {
    const debouncedRequest = useDebouncedRequest();

    return useCallback<FetchShareMap>(({ shareId, lastIndex, sessionName, pageSize }, signal) => {
        return debouncedRequest<ShareMapPayload>(queryShareMap(shareId, lastIndex, sessionName, pageSize), signal);
    }, []);
}
