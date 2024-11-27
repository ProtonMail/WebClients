import { usePreventLeave } from '@proton/components';
import { queryPublicCreateFolder } from '@proton/shared/lib/api/drive/folder';
import { queryPublicDeleteChildrenLinks } from '@proton/shared/lib/api/drive/link';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import {
    encryptName,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';
import chunk from '@proton/utils/chunk';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { usePublicSession } from '../_api';
import { useDriveEventManager } from '../_events';
import { useVolumesState } from '../_volumes';
import { encryptFolderExtendedAttributes } from './extendedAttributes';
import useLink from './useLink';
import { validateLinkName } from './validation';

/**
 * useLinkActions provides actions for manipulating with individual link.
 */
export function usePublicLinkActions() {
    const { preventLeave } = usePreventLeave();
    const { request: publicDebouncedRequest } = usePublicSession();
    const events = useDriveEventManager();
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const volumeState = useVolumesState();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        name: string,
        modificationTime?: Date
    ) => {
        // Name Hash is generated from LC, for case-insensitive duplicate detection.
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, parentLinkId),
            getLinkHashKey(abortSignal, shareId, parentLinkId),
        ]);

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(name, parentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate folder link lookup hash during folder creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                generateNodeKeys(parentPrivateKey, parentPrivateKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate folder link node keys during folder creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                encryptName(name, parentPrivateKey, parentPrivateKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt folder link name during folder creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
            ]);

        // We use private key instead of address key to sign the hash key
        // because its internal property of the folder. We use address key for
        // name or content to have option to trust some users more or less.
        const { NodeHashKey } = await generateNodeHashKey(privateKey, privateKey).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to encrypt node hash key during folder creation', {
                    tags: {
                        shareId,
                        parentLinkId,
                    },
                    extra: { e },
                })
            )
        );

        const xattr = !modificationTime
            ? undefined
            : await encryptFolderExtendedAttributes(modificationTime, privateKey, privateKey);

        const { Folder } = await preventLeave(
            publicDebouncedRequest<{ Folder: { ID: string } }>(
                queryPublicCreateFolder(shareId, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: '', //TODO: Add possibility to pass Address
                    ParentLinkID: parentLinkId,
                    XAttr: xattr,
                })
            )
        );

        const volumeId = volumeState.findVolumeId(shareId);
        if (volumeId) {
            await events.pollEvents.volumes(volumeId);
        }
        return Folder.ID;
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
        const responses: { batchLinkIds: string[]; response: T }[] = [];
        const successes: string[] = [];
        const failures: { [linkId: string]: any } = {};

        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const queue = batches.map(
            (batchLinkIds) => () =>
                publicDebouncedRequest<T>(query(batchLinkIds, shareId), abortSignal)
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
    };

    const deleteChildrenLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        linkIds: string[]
    ) => {
        return batchHelper(abortSignal, shareId, linkIds, (batchLinkIds) =>
            queryPublicDeleteChildrenLinks(shareId, parentLinkId, batchLinkIds)
        );
    };

    return {
        createFolder,
        deleteChildrenLinks,
    };
}
