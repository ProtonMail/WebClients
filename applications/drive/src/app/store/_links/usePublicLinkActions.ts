import { usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto/lib';
import { queryPublicCreateFolder } from '@proton/shared/lib/api/drive/folder';
import { queryPublicDeleteChildrenLinks } from '@proton/shared/lib/api/drive/link';
import { queryPublicRenameLink } from '@proton/shared/lib/api/drive/share';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import {
    encryptName,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import chunk from '@proton/utils/chunk';
import getRandomString from '@proton/utils/getRandomString';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { usePublicSession } from '../_api';
import { useShare } from '../_shares';
import { encryptFolderExtendedAttributes } from './extendedAttributes';
import useLink from './useLink';
import { validateLinkName } from './validation';

/**
 * useLinkActions provides actions for manipulating with individual link.
 */
export function usePublicLinkActions() {
    const { preventLeave } = usePreventLeave();
    const { request: publicDebouncedRequest, getAddressKeyInfo } = usePublicSession();
    const { getLinkPrivateKey, getLinkHashKey, getLink } = useLink();
    const { getSharePrivateKey } = useShare();

    const createFolder = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        name: string,
        modificationTime?: Date
    ) => {
        // Name Hash is generated from LC, for case-insensitive duplicate detection.
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey, addressKeyInfo] = await Promise.all([
            getLinkPrivateKey(abortSignal, token, parentLinkId),
            getLinkHashKey(abortSignal, token, parentLinkId),
            getAddressKeyInfo(abortSignal),
        ]);

        const signingKeys = addressKeyInfo?.privateKey || parentPrivateKey;

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(name, parentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate folder link lookup hash during folder creation', {
                            tags: {
                                token,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                generateNodeKeys(parentPrivateKey, signingKeys).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate folder link node keys during folder creation', {
                            tags: {
                                token,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                encryptName(name, parentPrivateKey, signingKeys).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt folder link name during folder creation', {
                            tags: {
                                token,
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
                        token,
                        parentLinkId,
                    },
                    extra: { e },
                })
            )
        );

        const xattr = !modificationTime
            ? undefined
            : await encryptFolderExtendedAttributes(
                  modificationTime,
                  privateKey,
                  addressKeyInfo ? addressKeyInfo.privateKey : privateKey
              );

        const { Folder } = await preventLeave(
            publicDebouncedRequest<{ Folder: { ID: string } }>(
                queryPublicCreateFolder(token, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureEmail: addressKeyInfo?.address.Email,
                    ParentLinkID: parentLinkId,
                    XAttr: xattr,
                })
            )
        );

        return Folder.ID;
    };

    const renameLink = async (
        abortSignal: AbortSignal,
        { token, linkId, newName }: { token: string; linkId: string; newName: string }
    ) => {
        const error = validateLinkName(newName);
        if (error) {
            throw new ValidationError(error);
        }

        const [meta, addressKeyInfo] = await Promise.all([
            getLink(abortSignal, token, linkId),
            getAddressKeyInfo(abortSignal),
        ]);

        if (!addressKeyInfo) {
            throw new Error('Cannot rename while anonymous');
        }

        if (meta.corruptedLink) {
            throw new Error('Cannot rename corrupted file');
        }

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            meta.parentLinkId
                ? getLinkPrivateKey(abortSignal, token, meta.parentLinkId)
                : getSharePrivateKey(abortSignal, token),
            meta.parentLinkId ? getLinkHashKey(abortSignal, token, meta.parentLinkId) : null,
        ]);

        const sessionKey = await getDecryptedSessionKey({
            data: meta.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during rename', {
                    tags: {
                        token,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        const [Hash, { message: encryptedName }] = await Promise.all([
            parentHashKey
                ? generateLookupHash(newName, parentHashKey).catch((e) =>
                      Promise.reject(
                          new EnrichedError('Failed to generate link lookup hash during rename', {
                              tags: {
                                  token,
                                  linkId,
                              },
                              extra: { e },
                          })
                      )
                  )
                : getRandomString(64),
            CryptoProxy.encryptMessage({
                textData: newName,
                stripTrailingSpaces: true,
                sessionKey,
                signingKeys: addressKeyInfo.privateKey,
            }).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt link name during rename', {
                        tags: {
                            token,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        await preventLeave(
            publicDebouncedRequest(
                queryPublicRenameLink(token, linkId, {
                    Name: encryptedName,
                    NameSignatureEmail: addressKeyInfo.address.Email,
                    Hash,
                    OriginalHash: meta.hash,
                })
            )
        );
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
        renameLink,
        createFolder,
        deleteChildrenLinks,
    };
}
