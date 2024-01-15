import { usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import {
    queryDeleteChildrenLinks,
    queryDeleteTrashedLinks,
    queryEmptyTrashOfShare,
    queryRestoreLinks,
    queryTrashLinks,
} from '@proton/shared/lib/api/drive/link';
import { queryMoveLink } from '@proton/shared/lib/api/drive/share';
import { queryVolumeEmptyTrash } from '@proton/shared/lib/api/drive/volume';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { encryptPassphrase, generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import chunk from '@proton/utils/chunk';
import groupWith from '@proton/utils/groupWith';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useDefaultShare, useShare } from '../_shares';
import { useVolumesState } from '../_volumes';
import useLink from './useLink';
import useLinks from './useLinks';
import useLinksState from './useLinksState';

const INVALID_REQUEST_ERROR_CODES = [RESPONSE_CODE.ALREADY_EXISTS, RESPONSE_CODE.INVALID_REQUIREMENT];

interface APIResponses {
    Responses: {
        Response: {
            Code: RESPONSE_CODE;
            Error?: string;
        };
    }[];
}

/**
 * useLinksActions provides actions for manipulating with links in batches.
 */
export function useLinksActions({
    queries,
}: {
    queries: {
        queryDeleteChildrenLinks: typeof queryDeleteChildrenLinks;
        queryDeleteTrashedLinks: typeof queryDeleteTrashedLinks;
        queryEmptyTrashOfShare: typeof queryEmptyTrashOfShare;
        queryRestoreLinks: typeof queryRestoreLinks;
        queryTrashLinks: typeof queryTrashLinks;
    };
}) {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey, getLinkHashKey } = useLink();
    const { getLinks } = useLinks();
    const { lockLinks, lockTrash, unlockLinks } = useLinksState();
    const { getDefaultShare } = useDefaultShare();

    const { getShareCreatorKeys } = useShare();
    const volumeState = useVolumesState();

    /**
     * withLinkLock is helper to lock provided `linkIds` before the action done
     * using `callback`, and ensure links are unlocked after its done no matter
     * the result of the action.
     */
    const withLinkLock = async <T>(shareId: string, linkIds: string[], callback: () => Promise<T>): Promise<T> => {
        lockLinks(shareId, linkIds);
        try {
            return await callback();
        } finally {
            const volumeId = volumeState.findVolumeId(shareId);
            if (volumeId) {
                await events.pollEvents.volumes(volumeId);
            }
            unlockLinks(shareId, linkIds);
        }
    };

    const moveLink = async (
        abortSignal: AbortSignal,
        {
            shareId,
            newParentLinkId,
            linkId,
            newShareId = shareId,
            silence = false,
        }: {
            shareId: string;
            newParentLinkId: string;
            linkId: string;
            newShareId?: string;
            silence?: boolean;
        }
    ) => {
        const [
            link,
            { passphrase, passphraseSessionKey },
            newParentPrivateKey,
            newParentHashKey,
            { privateKey: addressKey, address },
        ] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, newShareId, newParentLinkId),
            getLinkHashKey(abortSignal, newShareId, newParentLinkId),
            getShareCreatorKeys(abortSignal, newShareId),
        ]);

        if (link.corruptedLink) {
            throw new Error('Cannot move corrupted file');
        }

        const [currentParentPrivateKey, Hash, ContentHash, { NodePassphrase, NodePassphraseSignature }] =
            await Promise.all([
                getLinkPrivateKey(abortSignal, shareId, link.parentLinkId),
                generateLookupHash(link.name, newParentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate lookup hash during move', {
                            tags: {
                                shareId,
                                newParentLinkId,
                                newShareId: newShareId === shareId ? undefined : newShareId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                link.digests?.sha1 &&
                    generateLookupHash(link.digests.sha1, newParentHashKey).catch((e) =>
                        Promise.reject(
                            new EnrichedError('Failed to generate content hash during move', {
                                tags: {
                                    shareId,
                                    newParentLinkId,
                                    newShareId: newShareId === shareId ? undefined : newShareId,
                                    linkId,
                                },
                                extra: { e },
                            })
                        )
                    ),
                encryptPassphrase(newParentPrivateKey, addressKey, passphrase, passphraseSessionKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt link passphrase during move', {
                            tags: {
                                shareId,
                                newParentLinkId,
                                newShareId: newShareId === shareId ? undefined : newShareId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
            ]);

        const sessionKeyName = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: currentParentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during move', {
                    tags: {
                        shareId,
                        newParentLinkId,
                        newShareId: newShareId === shareId ? undefined : newShareId,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        const { message: encryptedName } = await CryptoProxy.encryptMessage({
            textData: link.name,
            stripTrailingSpaces: true,
            sessionKey: sessionKeyName,
            encryptionKeys: newParentPrivateKey,
            signingKeys: addressKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to encrypt link name during move', {
                    tags: {
                        shareId,
                        newParentLinkId,
                        newShareId: newShareId === shareId ? undefined : newShareId,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        await debouncedRequest({
            ...queryMoveLink(shareId, linkId, {
                Name: encryptedName,
                Hash,
                ParentLinkID: newParentLinkId,
                NodePassphrase,
                NodePassphraseSignature,
                SignatureAddress: address.Email,
                NewShareID: newShareId === shareId ? undefined : newShareId,
                ContentHash,
            }),
            silence,
        }).catch((err) => {
            if (INVALID_REQUEST_ERROR_CODES.includes(err?.data?.Code)) {
                throw new ValidationError(err.data.Error);
            }
            throw err;
        });

        const originalParentId = link.parentLinkId;
        return originalParentId;
    };

    const moveLinks = async (
        abortSignal: AbortSignal,
        {
            shareId,
            linkIds,
            newParentLinkId,
            newShareId,
            onMoved,
            onError,
            silence,
        }: {
            shareId: string;
            linkIds: string[];
            newParentLinkId: string;
            newShareId?: string;
            onMoved?: (linkId: string) => void;
            onError?: (linkId: string) => void;
            silence?: boolean;
        }
    ) => {
        return withLinkLock(shareId, linkIds, async () => {
            const originalParentIds: { [linkId: string]: string } = {};
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const moveQueue = linkIds.map((linkId) => async () => {
                return moveLink(abortSignal, { shareId, newParentLinkId, linkId, newShareId, silence })
                    .then((originalParentId) => {
                        successes.push(linkId);
                        originalParentIds[linkId] = originalParentId;
                        onMoved?.(linkId);
                    })
                    .catch((error) => {
                        failures[linkId] = error;
                        onError?.(linkId);
                    });
            });

            await preventLeave(runInQueue(moveQueue, MAX_THREADS_PER_REQUEST));
            return { successes, failures, originalParentIds };
        });
    };

    /**
     * batchHelper makes easier to do any action with many links in several
     * batches to make sure API can handle it (to not send thousands of links
     * in one request), all run in parallel (up to a reasonable limit).
     */
    const batchHelper = async <T>(
        abortSignal: AbortSignal,
        shareId: string,
        linkIds: string[],
        query: (batchLinkIds: string[], shareId: string) => any,
        maxParallelRequests = MAX_THREADS_PER_REQUEST
    ) => {
        return withLinkLock(shareId, linkIds, async () => {
            const responses: { batchLinkIds: string[]; response: T }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

            const queue = batches.map(
                (batchLinkIds) => () =>
                    debouncedRequest<T>(query(batchLinkIds, shareId), abortSignal)
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

    const batchHelperMultipleShares = async (
        abortSignal: AbortSignal,
        ids: { shareId: string; linkId: string }[],
        query: (batchLinkIds: string[], shareId: string) => any,
        maxParallelRequests = MAX_THREADS_PER_REQUEST
    ) => {
        const groupedByShareId = groupWith((a, b) => a.shareId === b.shareId, ids);

        const results = await Promise.all(
            groupedByShareId.map((group) => {
                return batchHelper<APIResponses>(
                    abortSignal,
                    group[0].shareId,
                    group.map(({ linkId }) => linkId),
                    query,
                    maxParallelRequests
                );
            })
        );

        const { responses, failures } = accumulateResults(results);
        const successes: string[] = [];
        responses.forEach(({ batchLinkIds, response }) => {
            response.Responses.forEach(({ Response }, index) => {
                const linkId = batchLinkIds[index];
                if (!Response.Error) {
                    successes.push(linkId);
                } else if (INVALID_REQUEST_ERROR_CODES.includes(Response.Code)) {
                    failures[linkId] = new ValidationError(Response.Error);
                } else {
                    failures[linkId] = Response.Error;
                }
            });
        });
        return { responses, successes, failures };
    };

    const trashLinks = async (
        abortSignal: AbortSignal,
        ids: { shareId: string; linkId: string; parentLinkId: string }[]
    ) => {
        const linksByParentIds = groupWith((a, b) => a.parentLinkId === b.parentLinkId, ids);

        const results = await Promise.all(
            linksByParentIds.map((linksGroup) => {
                const groupParentLinkId = linksGroup[0].parentLinkId;

                return batchHelperMultipleShares(abortSignal, linksGroup, (batchLinkIds, shareId) => {
                    return queries.queryTrashLinks(shareId, groupParentLinkId, batchLinkIds);
                });
            })
        );

        return accumulateResults(results);
    };

    const restoreLinks = async (abortSignal: AbortSignal, ids: { shareId: string; linkId: string }[]) => {
        /*
            Make sure to restore the most freshly trashed links first to ensure
            the potential parents are restored first because it is not possible
            to restore child if the parent stays in the trash.
            If user does not select the parent anyway, it is fine, it will just
            show error notification that some link(s) were not restored.
        */
        const links = await getLinks(abortSignal, ids);
        const sortedLinks = links.sort((a, b) => (b.trashed || 0) - (a.trashed || 0));
        const sortedLinkIds = sortedLinks.map(({ linkId, rootShareId }) => ({ linkId, shareId: rootShareId }));

        // Limit restore to one thread at a time only to make sure links are
        // restored in proper order (parents need to be restored before childs).
        const maxParallelRequests = 1;

        const results = await batchHelperMultipleShares(
            abortSignal,
            sortedLinkIds,
            (batchLinkIds, shareId) => {
                return queries.queryRestoreLinks(shareId, batchLinkIds);
            },
            maxParallelRequests
        );

        return results;
    };

    const deleteChildrenLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        linkIds: string[]
    ) => {
        return batchHelper(abortSignal, shareId, linkIds, (batchLinkIds) =>
            queryDeleteChildrenLinks(shareId, parentLinkId, batchLinkIds)
        );
    };

    const deleteTrashedLinks = async (abortSignal: AbortSignal, ids: { linkId: string; shareId: string }[]) => {
        return batchHelperMultipleShares(abortSignal, ids, (batchLinkIds, shareId) => {
            return queries.queryDeleteTrashedLinks(shareId, batchLinkIds);
        });
    };

    const emptyTrash = async (abortSignal: AbortSignal) => {
        const { volumeId } = await getDefaultShare();
        lockTrash();
        await debouncedRequest(queryVolumeEmptyTrash(volumeId), abortSignal);

        await events.pollEvents.volumes(volumeId);
    };

    return {
        moveLinks,
        trashLinks,
        restoreLinks,
        deleteChildrenLinks,
        deleteTrashedLinks,
        emptyTrash,
    };
}

export default function useLinksActionsWithQuieries() {
    return useLinksActions({
        queries: {
            queryTrashLinks,
            queryDeleteChildrenLinks,
            queryDeleteTrashedLinks,
            queryEmptyTrashOfShare,
            queryRestoreLinks,
        },
    });
}

interface Result<T> {
    responses: {
        batchLinkIds: string[];
        response: T;
    }[];
    successes: string[];
    failures: {
        [linkId: string]: any;
    };
}

function accumulateResults<T>(results: Result<T>[]): Result<T> {
    return results.reduce(
        (acc, result) => {
            acc.responses.push(...result.responses);
            acc.successes.push(...result.successes);
            acc.failures = { ...acc.failures, ...result.failures };
            return acc;
        },
        {
            responses: [],
            successes: [],
            failures: {},
        }
    );
}
