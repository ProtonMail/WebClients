import { useCallback } from 'react';

import { queryLinkMetaBatch, queryShareMap } from '@proton/shared/lib/api/drive/link';
import { LinkMetaBatchPayload, ShareMapPayload } from '@proton/shared/lib/interfaces/drive/link';

import useDebouncedRequest from '../../hooks/util/useDebouncedRequest';

export interface LinkMetaBatchPayloadWithShareId extends LinkMetaBatchPayload {
    shareId: string;
}

interface ShareMapParams {
    shareId: string;
    lastIndex?: number;
    sessionName?: string;
    pageSize?: number;
}

export type FetchShareMap = (params: ShareMapParams, signal?: AbortSignal) => Promise<ShareMapPayload>;

export type FetchLinkMetas = (
    params: { shareId: string; linkIds: string[] },
    signal?: AbortSignal
) => Promise<LinkMetaBatchPayloadWithShareId>;

export function useSearchAPI() {
    const debouncedRequest = useDebouncedRequest();

    const fetchShareMap: FetchShareMap = useCallback(({ shareId, lastIndex, sessionName, pageSize }, signal) => {
        return debouncedRequest<ShareMapPayload>(queryShareMap(shareId, lastIndex, sessionName, pageSize), signal);
    }, []);

    const fetchLinkMetas: FetchLinkMetas = useCallback(async ({ shareId, linkIds }, signal) => {
        const { Links } = await debouncedRequest<LinkMetaBatchPayload>(queryLinkMetaBatch(shareId, linkIds), signal);

        return {
            Links,
            shareId,
        };
    }, []);

    return {
        fetchShareMap,
        fetchLinkMetas,
    };
}
