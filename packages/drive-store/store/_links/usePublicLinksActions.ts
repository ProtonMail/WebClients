import { usePreventLeave } from '@proton/components';
import { queryPublicDeleteChildrenLinks } from '@proton/shared/lib/api/drive/link';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import chunk from '@proton/utils/chunk';

import { usePublicSession } from '../_api';
import useLinksState from './useLinksState';

interface LinkIdWithToken {
    linkId: string;
    authorizationToken?: string;
}

/**
 * usePublicLinksActions provides actions for manipulating with links in batches in a public context.
 */
export function usePublicLinksActions() {
    const { preventLeave } = usePreventLeave();
    const { request: publicDebouncedRequest } = usePublicSession();
    const { lockLinks, unlockLinks } = useLinksState();

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

    type ResponseType = {
        Code: number;
        Responses: {
            LinkID: string;
            Response: {
                Code: number;
                Error?: string;
            };
        }[];
    };
    /**
     * batchHelper makes easier to do any action with many links in several
     * batches to make sure API can handle it (to not send thousands of links
     * in one request), all run in parallel (up to a reasonable limit).
     */
    const deleteLinksBatchHelper = async (
        abortSignal: AbortSignal,
        token: string,
        linkIdsWithToken: LinkIdWithToken[],
        query: (batchLinkIdsWithToken: LinkIdWithToken[], token: string) => any,
        maxParallelRequests = MAX_THREADS_PER_REQUEST
    ) => {
        const linkIds = linkIdsWithToken.map(({ linkId }) => linkId);
        return withLinkLock(token, linkIds, async () => {
            const responses: {
                batchLinkIdsWithToken: LinkIdWithToken[];
                response: ResponseType;
            }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const batches = chunk(linkIdsWithToken, BATCH_REQUEST_SIZE);

            const queue = batches.map(
                (batchLinkIdsWithToken) => () =>
                    publicDebouncedRequest<ResponseType>(query(batchLinkIdsWithToken, token), abortSignal)
                        .then((response) => {
                            responses.push({ batchLinkIdsWithToken, response });
                            response.Responses.forEach(({ LinkID, Response }) => {
                                if (Response.Code === 1000) {
                                    successes.push(LinkID);
                                } else {
                                    failures[LinkID] = Response.Error;
                                }
                            });
                        })
                        .catch((error) => {
                            batchLinkIdsWithToken.forEach(({ linkId }) => (failures[linkId] = error));
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
        { token, parentLinkId, links }: { token: string; parentLinkId: string; links: LinkIdWithToken[] }
    ) => {
        return deleteLinksBatchHelper(abortSignal, token, links, (batchLinkIds) =>
            queryPublicDeleteChildrenLinks(
                token,
                parentLinkId,
                batchLinkIds.map(({ linkId, authorizationToken }) => ({
                    LinkID: linkId,
                    AuthorizationToken: authorizationToken,
                }))
            )
        );
    };

    return {
        deleteLinks,
    };
}
