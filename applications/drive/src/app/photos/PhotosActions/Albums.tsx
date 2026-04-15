import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications, usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto/lib';
import { PhotoTag, getDriveForPhotos } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { queryCreateAlbum, queryUpdateAlbumName } from '@proton/shared/lib/api/drive/photos';
import {
    encryptName,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import getRandomString from '@proton/utils/getRandomString';

import { getNotificationsManager } from '../../modules/notifications';
import { useDriveEventManager } from '../../store';
import { useDebouncedRequest } from '../../store/_api';
import { useLink, validateLinkName } from '../../store/_links';
import { useShare } from '../../store/_shares';
import { useErrorHandler } from '../../store/_utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getEllipsedName } from '../../utils/intl/getEllipsedName';
import { safeWrap } from '../../utils/safeWrap';
import { usePhotosStore } from '../usePhotos.store';

function useAlbumsActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLinkPrivateKey, getLinkHashKey, getLink } = useLink();
    const { getShareCreatorKeys, getSharePrivateKey } = useShare();

    const createAlbum = async (
        abortSignal: AbortSignal,
        volumeId: string,
        shareId: string,
        linkId: string,
        name: string
    ) => {
        // Name Hash is generated from LC, for case-insensitive duplicate detection.
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, linkId),
            getLinkHashKey(abortSignal, shareId, linkId),
            getShareCreatorKeys(abortSignal, shareId),
        ]);

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(name, parentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate album link lookup hash during album creation', {
                            tags: {
                                shareId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                generateNodeKeys(parentPrivateKey, addressKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate album link node keys during album creation', {
                            tags: {
                                shareId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                encryptName(name, parentPrivateKey, addressKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt album link name during album creation', {
                            tags: {
                                shareId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
            ]);

        // We use private key instead of address key to sign the hash key
        // because its internal property of the album. We use address key for
        // name or content to have option to trust some users more or less.
        const { NodeHashKey } = await generateNodeHashKey(privateKey, privateKey).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to encrypt node hash key during album creation', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        const { Album } = await preventLeave(
            debouncedRequest<{ Album: { Link: { LinkID: string } } }>(
                queryCreateAlbum(volumeId, {
                    Locked: false,
                    Link: {
                        Name: encryptedName,
                        Hash,
                        NodePassphrase,
                        NodePassphraseSignature,
                        SignatureEmail: address.Email,
                        NodeHashKey,
                        NodeKey,
                        XAttr: undefined, // for web it's always undefined, xattr is used on mobile for album mapping
                    },
                })
            )
        );

        // Usually, every event requires polling for events to be triggered
        // to update local cache. We can avoid this for albums as it is always
        // redirected to the album page after creation and added to the cache
        // manually.
        // If creation is ever used differently, following line needs to be
        // uncommented.
        //await events.pollEvents.volumes(volumeId);

        return Album.Link.LinkID;
    };

    const renameAlbum = async (
        abortSignal: AbortSignal,
        volumeId: string,
        shareId: string,
        linkId: string,
        newName: string
    ) => {
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
                          new EnrichedError('Failed to generate link lookup hash during album rename', {
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
            debouncedRequest<{ Code: number }>(
                queryUpdateAlbumName(volumeId, linkId, {
                    Link: {
                        Name: encryptedName,
                        Hash,
                        NameSignatureEmail: address.Email,
                        OriginalHash: meta.hash,
                    },
                })
            )
        );

        await events.pollEvents.volumes(volumeId);
    };

    return {
        createAlbum,
        renameAlbum,
    };
}

export const useCreateAlbum = () => {
    const { showErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();
    const { createAlbum } = useAlbumsActions();

    return useCallback(
        async (
            abortSignal: AbortSignal,
            volumeId: string,
            shareId: string,
            linkId: string,
            name: string
        ): Promise<string> => {
            const ellipsedName = getEllipsedName(name);
            try {
                const id = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                createNotification({
                    text: c('Notification').t`"${ellipsedName}" created successfully`,
                    preWrap: true,
                });
                return id;
            } catch (e) {
                showErrorNotification(e, safeWrap(c('Notification').t`"${ellipsedName}" failed to be created`));
                throw e;
            }
        },
        [createAlbum, createNotification, showErrorNotification]
    );
};

export const useRenameAlbum = () => {
    const { showErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();
    const { renameAlbum } = useAlbumsActions();

    return useCallback(
        async (
            abortSignal: AbortSignal,
            volumeId: string,
            shareId: string,
            linkId: string,
            name: string
        ): Promise<void> => {
            try {
                await renameAlbum(abortSignal, volumeId, shareId, linkId, name);
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`Album renamed successfully`}</span>,
                });
            } catch (e) {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`Album failed to be renamed`}</span>
                );
                throw e;
            }
        },
        [renameAlbum, createNotification, showErrorNotification]
    );
};

// TODO: Check if we click really really fast, so maybe some abortController needed
export const toggleFavorite = async (nodeUid: string) => {
    const photoItem = usePhotosStore.getState().getPhotoItem(nodeUid);
    if (!photoItem) {
        return;
    }
    const isFavorite = photoItem.tags.includes(PhotoTag.Favorites);
    try {
        await Array.fromAsync(
            getDriveForPhotos().updatePhotos([
                {
                    nodeUid,
                    tagsToAdd: isFavorite ? undefined : [PhotoTag.Favorites],
                    tagsToRemove: isFavorite ? [PhotoTag.Favorites] : undefined,
                },
            ])
        );
        await getBusDriver().emit(
            {
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: nodeUid, parentUid: photoItem.additionalInfo?.parentNodeUid }],
            },
            getDriveForPhotos()
        );

        // Show notification only when favoriting from a shared album (i.e. the photo is copied to own stream).
        // We check if the photo's parent is NOT the user's own photos root folder.
        const photosRootFolder = await getDriveForPhotos().getMyPhotosRootFolder();
        const photosRootFolderUid = photosRootFolder.ok ? photosRootFolder.value.uid : undefined;
        const isOwnPhoto = photosRootFolderUid && photoItem.additionalInfo?.parentNodeUid === photosRootFolderUid;
        if (!isOwnPhoto && !isFavorite) {
            getNotificationsManager().createNotification({
                text: c('Info').t`Photo was copied to stream and marked favorite there.`,
            });
        }
    } catch (e) {
        handleSdkError(e, {
            showNotification: true,
            fallbackMessage: isFavorite
                ? c('Error').t`Could not remove from favorites`
                : c('Error').t`Could not add to favorites`,
        });
    }
};
