import { c } from 'ttag';

import { usePreventLeave } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { queryCreateFolder } from '@proton/shared/lib/api/drive/folder';
import { queryRenameLink } from '@proton/shared/lib/api/drive/share';
import { queryCopyNodeToVolume } from '@proton/shared/lib/api/drive/volume';
import type { CopyRelatedPhotos } from '@proton/shared/lib/interfaces/drive/volume';
import {
    encryptName,
    encryptPassphrase,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import getRandomString from '@proton/utils/getRandomString';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useShare } from '../_shares';
import { useBatchHelper } from '../_utils/useBatchHelper';
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
    const { getLink, getLinkPrivateKey, getLinkHashKey, getLinkPassphraseAndSessionKey } = useLink();
    const { getSharePrivateKey, getShareCreatorKeys } = useShare();
    const { batchPromiseHelper } = useBatchHelper();
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
                    NameSignatureEmail: address.Email,
                    OriginalHash: meta.hash,
                })
            )
        );
        const volumeId = volumeState.findVolumeId(shareId);

        if (volumeId) {
            await events.pollEvents.volumes(volumeId);
        }
    };

    // This is so photos from photo-stream can be added to an album (without re-uploading content)
    // Creates new nodepasphrases based on the album node (and not the photos root share)
    // Re-encrypt name with album node key
    // Or it can be used also for the other way round, copying a not-owned photo into a photo gallery
    // Basically this function "clone" a photo into your own ownership (using your own keys)
    // See RFC [0048] for details
    const getPhotoCloneForAlbum = async (
        abortSignal: AbortSignal,
        parentShareId: string,
        shareId: string,
        parentLinkId: string,
        linkId: string
    ) => {
        const [
            link,
            parentPrivateKey,
            parentHashKey,
            { passphrase, passphraseSessionKey },
            { privateKey: addressKey, address },
        ] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, parentShareId, parentLinkId),
            getLinkHashKey(abortSignal, parentShareId, parentLinkId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getShareCreatorKeys(abortSignal, shareId),
        ]);

        const [Hash, { NodePassphrase, NodePassphraseSignature }, ContentHash, currentParentPrivateKey] =
            await Promise.all([
                generateLookupHash(link.name, parentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate photo link lookup hash during photo clone creation', {
                            tags: {
                                parentShareId,
                                shareId,
                                parentLinkId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                encryptPassphrase(parentPrivateKey, addressKey, passphrase, passphraseSessionKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt link passphrase during clone', {
                            tags: {
                                parentShareId,
                                shareId,
                                parentLinkId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                link.digests?.sha1
                    ? generateLookupHash(link.digests?.sha1, parentHashKey).catch((e) =>
                          Promise.reject(
                              new EnrichedError('Failed to generate content hash during clone', {
                                  tags: {
                                      parentShareId,
                                      shareId,
                                      parentLinkId,
                                      linkId,
                                  },
                                  extra: { e },
                              })
                          )
                      )
                    : undefined,
                link.parentLinkId
                    ? getLinkPrivateKey(abortSignal, shareId, link.parentLinkId)
                    : getSharePrivateKey(abortSignal, shareId),
            ]);

        let privateKey: PrivateKeyReference = currentParentPrivateKey;
        if (link.photoProperties?.albums.length && !link.parentLinkId) {
            for (const album of link.photoProperties.albums) {
                try {
                    const albumPrivateKey = await getLinkPrivateKey(abortSignal, shareId, album.albumLinkId);
                    privateKey = albumPrivateKey;
                    // we can break at first album since it's enough to decrypt / for optimization
                    break;
                } catch (e) {
                    // ignore failures but still report them to Sentry
                    sendErrorReport(e, {
                        extra: {
                            message: 'getPhotoCloneForAlbum() - Failed to get albumPrivateKey',
                        },
                    });
                }
            }
        }
        const sessionKeyName = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: [privateKey],
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during clone', {
                    tags: {
                        parentShareId,
                        shareId,
                        parentLinkId,
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
            encryptionKeys: parentPrivateKey,
            signingKeys: addressKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to encrypt link name during clone', {
                    tags: {
                        parentShareId,
                        shareId,
                        parentLinkId,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        return {
            Hash,
            Name: encryptedName,
            NodePassphrase,
            NodePassphraseSignature,
            SignatureAddress: address.Email,
            ContentHash,
        };
    };

    const copyLinkToVolume = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        targetVolumeId: string,
        targetParentShareId: string,
        targetParentLinkId: string
    ) => {
        const link = await getLink(abortSignal, shareId, linkId);
        const clone = await getPhotoCloneForAlbum(
            abortSignal,
            targetParentShareId,
            shareId,
            targetParentLinkId,
            linkId
        );
        const photos: CopyRelatedPhotos[] = [];
        if (link.photoProperties && link.activeRevision?.photo?.relatedPhotosLinkIds) {
            const photosData = await batchPromiseHelper(
                link.activeRevision.photo.relatedPhotosLinkIds,
                async (photoLinkId) => {
                    const photoClone = await getPhotoCloneForAlbum(
                        abortSignal,
                        targetParentShareId,
                        shareId,
                        targetParentLinkId,
                        photoLinkId
                    );
                    const ContentHash = clone.ContentHash || link.activeRevision?.photo?.contentHash;
                    if (!ContentHash) {
                        throw new Error('ContentHash being empty should not happen');
                    }
                    return {
                        LinkID: photoLinkId,
                        Name: photoClone.Name,
                        NodePassphrase: photoClone.NodePassphrase,
                        Hash: photoClone.Hash,
                        ContentHash: ContentHash,
                    };
                },
                10,
                abortSignal
            );

            photos.push(...photosData);
        }

        const ContentHash = clone.ContentHash || link.activeRevision?.photo?.contentHash;
        if (!ContentHash) {
            throw new Error('ContentHash being empty should not happen');
        }

        const { Code, LinkID } = await preventLeave(
            debouncedRequest<{ Code: Number; LinkID: string }>(
                queryCopyNodeToVolume(link.volumeId, linkId, {
                    Name: clone.Name,
                    NodePassphrase: clone.NodePassphrase,
                    Hash: clone.Hash,
                    TargetVolumeID: targetVolumeId,
                    TargetParentLinkID: targetParentLinkId,
                    NameSignatureEmail: clone.SignatureAddress,
                    // TODO: Only for anonymous copy / not done yet
                    // NodePassphraseSignature: clone.NodePassphraseSignature,
                    // SignatureEmail: clone.SignatureAddress,
                    ...(link.photoProperties && {
                        Photos: {
                            ContentHash,
                            RelatedPhotos: photos,
                        },
                    }),
                })
            )
        );

        if (Code !== 1000) {
            throw new Error('Saving photo failed');
        }
        return LinkID;
    };

    const copyLinksToVolume = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkIds: string[],
        targetVolumeId: string,
        targetParentShareId: string,
        targetParentLinkId: string
    ) => {
        const failures: { [linkId: string]: string | undefined } = {};
        const successes: string[] = [];

        await preventLeave(
            batchPromiseHelper(
                linkIds,
                async (linkId: string) => {
                    try {
                        const result = await copyLinkToVolume(
                            abortSignal,
                            shareId,
                            linkId,
                            targetVolumeId,
                            targetParentShareId,
                            targetParentLinkId
                        );

                        if (result) {
                            successes.push(result);
                        }
                    } catch (error) {
                        sendErrorReport(error, {
                            extra: {
                                message: 'copyLinksToVolume() - Failed to copy a link',
                            },
                        });
                        failures[linkId] =
                            error instanceof Error ? error.message : c('Error').t`Failed to copy photo to album`;
                        return undefined;
                    }
                },
                10,
                abortSignal
            )
        );

        return {
            successes,
            failures,
        };
    };

    return {
        createFolder,
        renameLink,
        getPhotoCloneForAlbum,
        copyLinkToVolume,
        copyLinksToVolume,
    };
}
