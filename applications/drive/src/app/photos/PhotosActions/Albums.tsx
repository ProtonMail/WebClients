import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { usePreventLeave } from '@proton/components';
import { queryCreateAlbum, queryUpdateAlbumName } from '@proton/shared/lib/api/drive/photos';
import {
    encryptName,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
} from '@proton/shared/lib/keys/driveKeys';

import { useDriveEventManager } from '../../store';
import { useDebouncedRequest } from '../../store/_api';
import { useLink, validateLinkName } from '../../store/_links';
import { useShare } from '../../store/_shares';
import { useErrorHandler } from '../../store/_utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';

function useAlbumsActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLinkPrivateKey, getLinkHashKey, getLink } = useLink();
    const { getShareCreatorKeys } = useShare();

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

        await events.pollEvents.volumes(volumeId);

        return Album.Link.LinkID;
    };

    const renameAlbum = async (
        abortSignal: AbortSignal,
        volumeId: string,
        shareId: string,
        linkId: string,
        name: string
    ) => {
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey, { privateKey: addressKey }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, linkId),
            getLinkHashKey(abortSignal, shareId, linkId),
            getShareCreatorKeys(abortSignal, shareId),
        ]);

        const [Hash, encryptedName] = await Promise.all([
            generateLookupHash(name, parentHashKey).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to generate album link lookup hash during album rename', {
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
                    new EnrichedError('Failed to encrypt album link name during album rename', {
                        tags: {
                            shareId,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        const link = await getLink(abortSignal, shareId, linkId);

        const { Code } = await preventLeave(
            debouncedRequest<{ Code: number }>(
                queryUpdateAlbumName(volumeId, linkId, {
                    Link: {
                        Name: encryptedName,
                        Hash,
                        OriginalHash: link.hash,
                        NameSignatureEmail: link.nameSignatureEmail,
                    },
                })
            )
        );

        if (Code !== 1000) {
            throw new EnrichedError('Failed to rename album', {
                tags: {
                    shareId,
                    linkId,
                },
            });
        }
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
            try {
                const id = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`"${name}" created successfully`}</span>,
                });
                return id;
            } catch (e) {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`"${name}" failed to be created`}</span>
                );
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
