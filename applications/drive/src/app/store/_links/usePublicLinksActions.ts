import { usePreventLeave } from '@proton/components';
import { queryPublicDeleteChildrenLinks } from '@proton/shared/lib/api/drive/link';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import chunk from '@proton/utils/chunk';

import { useAnonymousUploadAuthStore } from '../../zustand/upload/anonymous-auth.store';
import { usePublicSession } from '../_api';
import useLinksState from './useLinksState';

/**
 * usePublicLinksActions provides actions for manipulating with links in batches in a public context.
 */
export function usePublicLinksActions() {
    const { preventLeave } = usePreventLeave();
    const { request: publicDebouncedRequest, user } = usePublicSession();
    const { lockLinks, unlockLinks } = useLinksState();
    const { getUploadToken } = useAnonymousUploadAuthStore();

    /**
     * withLinkLock is helper to lock provided `linkIds` before the action done
     * using `callback`, and ensure links are unlocked after its done no matter
     * the result of the action.
     */
    const withLinkLock = async <T>(token: string, linkIds: string[], callback: () => Promise<T>): Promise<T> => {
        lockLinks(token, linkIds);
        try {
            return await callback();
        } finally {
            unlockLinks(token, linkIds);
        }
    };

    /**
     * batchHelper makes easier to do any action with many links in several
     * batches to make sure API can handle it (to not send thousands of links
     * in one request), all run in parallel (up to a reasonable limit).
     */
    const batchHelper = async <T>(
        abortSignal: AbortSignal,
        token: string,
        linkIds: string[],
        query: (batchLinkIds: string[], token: string) => any,
        maxParallelRequests = MAX_THREADS_PER_REQUEST
    ) => {
        return withLinkLock(token, linkIds, async () => {
            const responses: { batchLinkIds: string[]; response: T }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

            const queue = batches.map(
                (batchLinkIds) => () =>
                    publicDebouncedRequest<T>(query(batchLinkIds, token), abortSignal)
                        .then((response) => {
                            responses.push({ batchLinkIds, response });
                            batchLinkIds.forEach((linkId) => successes.push(linkId));
                        })
                        .catch((error) => {
                            batchLinkIds.forEach((linkId) => (failures[linkId] = error));
                        })
            );
            await preventLeave(runInQueue(queue, maxParallelRequests));
            return {
                responses,
                successes,
                failures,
            };
        });
    };

    const deleteLinks = async (
        abortSignal: AbortSignal,
        { token, parentLinkId, linkIds }: { token: string; parentLinkId: string; linkIds: string[] }
    ) => {
        return batchHelper(abortSignal, token, linkIds, (batchLinkIds) =>
            queryPublicDeleteChildrenLinks(
                token,
                parentLinkId,
                batchLinkIds.map((linkId) => ({
                    LinkID: linkId,
                    AuthorizationToken: !user ? getUploadToken(linkId) : undefined,
                }))
            )
        );
    };

    return {
        deleteLinks,
    };
}
