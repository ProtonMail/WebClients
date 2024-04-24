import { usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import { queryCreateFolder } from '@proton/shared/lib/api/drive/folder';
import { queryRenameLink } from '@proton/shared/lib/api/drive/share';
import {
    encryptName,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import getRandomString from '@proton/utils/getRandomString';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useShare } from '../_shares';
import { useVolumesState } from '../_volumes';
import { encryptFolderExtendedAttributes } from './extendedAttributes';
import useLink from './useLink';
import { validateLinkName } from './validation';

/**
 * useLinkActions provides actions for manipulating with individual link.
 */
export default function useLinkActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLink, getLinkPrivateKey, getLinkSessionKey, getLinkHashKey } = useLink();
    const { getSharePrivateKey, getShareCreatorKeys } = useShare();
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

        const [parentPrivateKey, parentHashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, parentLinkId),
            getLinkHashKey(abortSignal, shareId, parentLinkId),
            getShareCreatorKeys(abortSignal, shareId),
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
                generateNodeKeys(parentPrivateKey, addressKey).catch((e) =>
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
                encryptName(name, parentPrivateKey, addressKey).catch((e) =>
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
            : await encryptFolderExtendedAttributes(modificationTime, privateKey, addressKey);

        const { Folder } = await preventLeave(
            debouncedRequest<{ Folder: { ID: string } }>(
                queryCreateFolder(shareId, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: address.Email,
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

    const renameLink = async (abortSignal: AbortSignal, shareId: string, linkId: string, newName: string) => {
        const error = validateLinkName(newName);
        if (error) {
            throw new ValidationError(error);
        }

        const [meta, { privateKey: addressKey, address }] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getShareCreatorKeys(abortSignal, shareId),
        ]);

        if (meta.corruptedLink) {
            throw new Error('Cannot rename corrupted file');
        }

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            meta.parentLinkId
                ? getLinkPrivateKey(abortSignal, shareId, meta.parentLinkId)
                : getSharePrivateKey(abortSignal, shareId),
            meta.parentLinkId ? getLinkHashKey(abortSignal, shareId, meta.parentLinkId) : null,
        ]);

        const sessionKey = await getDecryptedSessionKey({
            data: meta.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during rename', {
                    tags: {
                        shareId,
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
                                  shareId,
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
                signingKeys: addressKey,
            }).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt link name during rename', {
                        tags: {
                            shareId,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        await preventLeave(
            debouncedRequest(
                queryRenameLink(shareId, linkId, {
                    Name: encryptedName,
                    Hash,
                    SignatureAddress: address.Email,
                    OriginalHash: meta.hash,
                })
            )
        );
        const volumeId = volumeState.findVolumeId(shareId);

        if (volumeId) {
            await events.pollEvents.volumes(volumeId);
        }
    };

    /**
     * checkLinkMetaSignatures checks for all signatures of various attributes:
     * passphrase, hash key, name or xattributes. It does not check content,
     * that is file blocks including thumbnail block.
     */
    const checkLinkMetaSignatures = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [link] = await Promise.all([
            // Decrypts name and xattributes.
            getLink(abortSignal, shareId, linkId),
            // Decrypts passphrase.
            getLinkPrivateKey(abortSignal, shareId, linkId),
        ]);
        if (link.isFile) {
            await getLinkSessionKey(abortSignal, shareId, linkId);
        } else {
            await getLinkHashKey(abortSignal, shareId, linkId);
        }
        // Get latest link with signature updates.
        return (await getLink(abortSignal, shareId, linkId)).signatureIssues;
    };

    return {
        createFolder,
        renameLink,
        checkLinkMetaSignatures,
    };
}
