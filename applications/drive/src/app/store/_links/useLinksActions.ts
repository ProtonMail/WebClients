import { usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import {
    queryDeleteChildrenLinks,
    queryDeleteTrashedLinks,
    queryRestoreLinks,
    queryTrashLinks,
} from '@proton/shared/lib/api/drive/link';
import type { RelatedPhotos } from '@proton/shared/lib/api/drive/photos';
import { queryAddPhotoToFavorite } from '@proton/shared/lib/api/drive/photos';
import { queryMoveLink } from '@proton/shared/lib/api/drive/share';
import { queryVolumeEmptyTrash } from '@proton/shared/lib/api/drive/volume';
import { API_CODES } from '@proton/shared/lib/constants';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { encryptPassphrase, generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import groupWith from '@proton/utils/groupWith';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { ShareType, useDefaultShare, useShare } from '../_shares';
import { useBatchHelper } from '../_utils/useBatchHelper';
import { useVolumesState } from '../_volumes';
import type { DecryptedLink } from './interface';
import useLink from './useLink';
import useLinks from './useLinks';
import useLinksState from './useLinksState';

const INVALID_REQUEST_ERROR_CODES = [
    API_CODES.ALREADY_EXISTS_ERROR,
    API_CODES.INVALID_REQUIREMENT_ERROR,
    API_CODES.NOT_ALLOWED_ERROR,
];

/**
 * useLinksActions provides actions for manipulating with links in batches.
 */
export function useLinksActions({
    queries,
}: {
    queries: {
        queryDeleteChildrenLinks: typeof queryDeleteChildrenLinks;
        queryDeleteTrashedLinks: typeof queryDeleteTrashedLinks;
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
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();

    const { getShareCreatorKeys, getShare } = useShare();
    const volumeState = useVolumesState();

    const batchHelper = useBatchHelper();

    /**
     * withLinkLock is helper to lock provided `linkIds` before the action done
     * using `callback`, and ensure links are unlocked after its done no matter
     * the result of the action.
     */
    const withLinkLock = async <T>({
        shareId,
        volumeId,
        linkIds,
        callback,
    }:
        | {
              shareId: string;
              volumeId?: string;
              linkIds: string[];
              callback: () => Promise<T>;
          }
        | {
              shareId?: string;
              volumeId: string;
              linkIds: string[];
              callback: () => Promise<T>;
          }): Promise<T> => {
        if (shareId) {
            lockLinks(shareId, linkIds);
        }

        try {
            return await callback();
        } finally {
            let resolvedVolumeId = volumeId;

            if (shareId && !volumeId) {
                resolvedVolumeId = volumeState.findVolumeId(shareId);
            }

            if (resolvedVolumeId) {
                await events.pollEvents.volumes(resolvedVolumeId);
            }

            if (shareId) {
                unlockLinks(shareId, linkIds);
            }
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
            newShare,
        ] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, newShareId, newParentLinkId),
            getLinkHashKey(abortSignal, newShareId, newParentLinkId),
            getShareCreatorKeys(abortSignal, newShareId),
            getShare(abortSignal, newShareId),
        ]);

        if (link.corruptedLink) {
            throw new Error('Cannot move corrupted file');
        }

        const isPhotosShare = newShare.type === ShareType.photos;

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
                // ContentHash is only needed for Photos section and during recovery of photos
                link.digests?.sha1 && isPhotosShare
                    ? generateLookupHash(link.digests.sha1, newParentHashKey).catch((e) =>
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
                      )
                    : undefined,
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

        const baseRequestBody = {
            Name: encryptedName,
            Hash,
            ParentLinkID: newParentLinkId,
            NewShareID: newShareId === shareId ? undefined : newShareId,
            // In case of missing xattr attributes we prefer to use the current content hash than breaking move/recovery
            // TODO: [DRVWEB-4651]
            ContentHash: isPhotosShare ? ContentHash || link.activeRevision?.photo?.contentHash : undefined,
            NameSignatureEmail: address.Email,
            NodePassphrase,
        };

        // There are three cases for move request body:
        // 1. In case the file was uploaded by logged-in proton user, we will not pass NodePassphraseSignature and SignatureEmail,
        //    which means it was uploaded by logged-in proton user.
        // 2. In case the file was uploaded by logged-in proton user, but renamed/moved by anonymous user,
        //    The link will have nameSignatureEmail and no signatureEmail:
        //    -> Add NodePassphraseSignature and SignatureEmail
        // 3. In case the file was uploaded by an anonymous user,
        //    The link will have no nameSignatureEmail and signatureEmail:
        //    -> Add NodePassphraseSignature, SignatureEmail, and NameSignatureEmail
        const requestBody = {
            ...baseRequestBody,
            ...(!!link.nameSignatureEmail &&
                !link.signatureEmail && {
                    NodePassphraseSignature,
                    SignatureEmail: address.Email,
                }),
            ...(!link.nameSignatureEmail &&
                !link.signatureEmail && {
                    NodePassphraseSignature,
                    SignatureEmail: address.Email,
                    NameSignatureEmail: address.Email,
                }),
        };

        await debouncedRequest({
            ...queryMoveLink(shareId, linkId, requestBody),
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
        return withLinkLock({
            shareId,
            linkIds,
            callback: async () => {
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
            },
        });
    };

    const favoritePhotoLink = async (
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
            newShare,
        ] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, newShareId, newParentLinkId),
            getLinkHashKey(abortSignal, newShareId, newParentLinkId),
            getShareCreatorKeys(abortSignal, newShareId),
            getShare(abortSignal, newShareId),
        ]);

        if (link.corruptedLink) {
            throw new Error('Cannot move corrupted file');
        }

        const isPhotosShare = newShare.type === ShareType.photos;

        if (!isPhotosShare) {
            throw new Error('You can only favorite photos');
        }
        // PhotoData in body is included in the case the photo needs to be copied to the photo gallery
        const includePhotoData = link.parentLinkId !== newShare.rootLinkId;
        let body = {};
        if (includePhotoData) {
            const getLinkMovedParameters = async (link: DecryptedLink) => {
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
                        link.digests?.sha1
                            ? generateLookupHash(link.digests.sha1, newParentHashKey).catch((e) =>
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
                              )
                            : undefined,
                        encryptPassphrase(newParentPrivateKey, addressKey, passphrase, passphraseSessionKey).catch(
                            (e) =>
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

                return {
                    Name: encryptedName,
                    Hash,
                    ContentHash: ContentHash,
                    NameSignatureEmail: address.Email,
                    NodePassphrase,
                    ...(!!link.nameSignatureEmail &&
                        !link.signatureEmail && {
                            NodePassphraseSignature,
                            SignatureEmail: address.Email,
                        }),
                    ...(!link.nameSignatureEmail &&
                        !link.signatureEmail && {
                            NodePassphraseSignature,
                            SignatureEmail: address.Email,
                            NameSignatureEmail: address.Email,
                        }),
                };
            };

            const data = await getLinkMovedParameters(link);

            // TODO [DRVWEB-4651]:

            /*
                New content hash is computed from sha1 located in extended attributes. This digest is set by clients and cannot be trusted. It can be wrong, set by malicious user, or missing entirely.
                The only truly safe method would be to download the whole content and compute sha1 again [DRVWEB-4651]. That is not great UX and we decided to ignore this fact as the only consequence is that:
                    * user will be able to upload the same photo again (de-duplication protection will not work),
                    * or some other photo matching malicious hash will be rejected as duplicate (de-duplication will reject).

            */
            if (!data.ContentHash) {
                throw new Error('ContentHash could not be computed');
            }

            let RelatedPhotosData: RelatedPhotos[] = [];
            if (link.activeRevision?.photo?.relatedPhotosLinkIds) {
                const BATCH_SIZE = 10;
                const processRelatedPhotosInBatches = async (
                    link: DecryptedLink,
                    abortSignal: AbortSignal,
                    shareId: string,
                    batchSize: number = 10
                ): Promise<RelatedPhotos[]> => {
                    const relatedIds = link.activeRevision?.photo?.relatedPhotosLinkIds;
                    const relatedPhotosData: RelatedPhotos[] = [];
                    if (!relatedIds) {
                        return relatedPhotosData;
                    }
                    for (let i = 0; i < relatedIds.length; i += batchSize) {
                        const batch = relatedIds.slice(i, i + batchSize);

                        const batchResults = await Promise.all(
                            batch.map(async (id: string) => {
                                const link = await getLink(abortSignal, shareId, id);
                                const data = await getLinkMovedParameters(link);

                                if (!data.ContentHash) {
                                    throw new Error('ContentHash could not be computed');
                                }

                                return {
                                    ...data,
                                    LinkID: id,
                                    ContentHash: data.ContentHash,
                                };
                            })
                        );

                        relatedPhotosData.push(...batchResults);
                    }

                    return relatedPhotosData;
                };
                RelatedPhotosData = await processRelatedPhotosInBatches(link, abortSignal, shareId, BATCH_SIZE);
            }

            body = {
                PhotoData: {
                    ...data,
                    RelatedPhotos: RelatedPhotosData,
                },
            };
        }

        const { LinkID } = await debouncedRequest<{
            LinkID: string;
            Code: number;
        }>({
            ...queryAddPhotoToFavorite(newShare.volumeId, linkId, body),
            silence,
        }).catch((err) => {
            if (INVALID_REQUEST_ERROR_CODES.includes(err?.data?.Code)) {
                throw new ValidationError(err.data.Error);
            }
            throw err;
        });

        return LinkID;
    };

    const batchHelperMultipleVolumes = async (
        abortSignal: AbortSignal,
        ids: { volumeId: string; linkId: string }[],
        query: (batchLinkIds: string[], volumeId: string) => object,
        maxParallelRequests = MAX_THREADS_PER_REQUEST
    ) => {
        const groupedByVolumeId = groupWith((a, b) => a.volumeId === b.volumeId, ids);
        const results = await Promise.all(
            groupedByVolumeId.map((group) => {
                const linkIds = group.map(({ linkId }) => linkId);
                return withLinkLock({
                    volumeId: group[0].volumeId,
                    linkIds,
                    callback: () =>
                        batchHelper(abortSignal, {
                            linkIds,
                            query: (batchLinkIds) => query(batchLinkIds, group[0].volumeId),
                            maxParallelRequests,
                        }),
                });
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

    const trashLinks = async (abortSignal: AbortSignal, ids: { linkId: string; volumeId: string }[]) => {
        const linksByVolumeIds = groupWith((a, b) => a.volumeId === b.volumeId, ids);
        const results = await Promise.all(
            linksByVolumeIds.map((linksGroup) => {
                const groupVolumeId = linksGroup[0].volumeId;

                return batchHelperMultipleVolumes(abortSignal, linksGroup, (batchLinkIds) => {
                    return queries.queryTrashLinks(groupVolumeId, batchLinkIds);
                });
            })
        );

        return accumulateResults(results);
    };

    const restoreLinks = async (
        abortSignal: AbortSignal,
        ids: { volumeId: string; shareId: string; linkId: string }[]
    ) => {
        /*
            Make sure to restore the most freshly trashed links first to ensure
            the potential parents are restored first because it is not possible
            to restore child if the parent stays in the trash.
            If user does not select the parent anyway, it is fine, it will just
            show error notification that some link(s) were not restored.
        */
        const links = await getLinks(abortSignal, ids);
        const sortedLinks = links.sort((a, b) => (b.trashed || 0) - (a.trashed || 0));
        const sortedLinkIds = sortedLinks.map(({ linkId, volumeId }) => ({
            linkId,
            volumeId,
        }));

        // Limit restore to one thread at a time only to make sure links are
        // restored in proper order (parents need to be restored before childs).
        const maxParallelRequests = 1;

        const results = await batchHelperMultipleVolumes(
            abortSignal,
            sortedLinkIds,
            (batchLinkIds, volumeId) => {
                return queries.queryRestoreLinks(volumeId, batchLinkIds);
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
        return withLinkLock({
            shareId,
            linkIds,
            callback: () =>
                batchHelper(abortSignal, {
                    linkIds,
                    query: (batchLinkIds) => queryDeleteChildrenLinks(shareId, parentLinkId, batchLinkIds),
                }),
        });
    };

    const deleteTrashedLinks = async (abortSignal: AbortSignal, ids: { linkId: string; volumeId: string }[]) => {
        return batchHelperMultipleVolumes(abortSignal, ids, (batchLinkIds, volumeId) => {
            return queries.queryDeleteTrashedLinks(volumeId, batchLinkIds);
        });
    };

    const emptyTrash = async (abortSignal: AbortSignal) => {
        const { volumeId } = await getDefaultShare();
        const photosShare = await getDefaultPhotosShare();
        lockTrash();
        await debouncedRequest(queryVolumeEmptyTrash(volumeId), abortSignal);
        await events.pollEvents.volumes(volumeId);
        if (photosShare && volumeId !== photosShare.volumeId) {
            await debouncedRequest(queryVolumeEmptyTrash(photosShare.volumeId), abortSignal);
            await events.pollEvents.volumes(photosShare.volumeId);
        }
    };

    return {
        moveLinks,
        trashLinks,
        restoreLinks,
        deleteChildrenLinks,
        deleteTrashedLinks,
        emptyTrash,
        favoritePhotoLink,
    };
}

export default function useLinksActionsWithQuieries() {
    return useLinksActions({
        queries: {
            queryTrashLinks,
            queryDeleteChildrenLinks,
            queryDeleteTrashedLinks,
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
