import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { NodeType } from '@proton/drive/index';
import { querySharedWithMeAlbums } from '@proton/shared/lib/api/drive/photos';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ShareTargetType } from '@proton/shared/lib/interfaces/drive/sharing';

import { type Album } from '../../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { useDebouncedRequest } from '../../../store/_api';
import { useInvitationsListing } from '../../../store/_invitations';
import { type DecryptedLink, useLink } from '../../../store/_links';
import { useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useLegacyErrorHandler } from '../../../utils/errorHandling/useLegacyErrorHandler';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';

export const useLegacyLoader = () => {
    const { handleError } = useLegacyErrorHandler();
    const { loadSharedInfo } = useSharedInfoBatcher();
    const { createNotification } = useNotifications();

    const request = useDebouncedRequest();
    const { getLink } = useLink();

    const { getCachedAlbumsInvitations, loadInvitations } = useInvitationsListing();
    const cachedInvitations = getCachedAlbumsInvitations();

    const invitations = useMemoArrayNoMatterTheOrder(cachedInvitations);

    const [albums, setAlbums] = useState<DecryptedLink[]>([]);

    const cachedLinks = useMemoArrayNoMatterTheOrder(albums);

    const loadLegacySharedWithMeAlbums = useCallback(
        async (abortSignal: AbortSignal) => {
            const sharedWithMeCall = async (anchorID?: string) => {
                const { Albums, Code, AnchorID, More } = await request<{
                    Albums: Album[];
                    Code: number;
                    AnchorID: string;
                    More: boolean;
                }>(
                    querySharedWithMeAlbums({
                        AnchorID: anchorID,
                    }),
                    abortSignal
                );
                if (Code === 1000) {
                    let showErrorNotification = false;
                    await Promise.all(
                        Albums.map(async (album) => {
                            try {
                                if (album.ShareID === null) {
                                    return;
                                }

                                const link = await getLink(abortSignal, album.ShareID, album.LinkID);
                                setAlbums((prevAlbums) => [...prevAlbums, link]);
                            } catch (e) {
                                handleError(e, {
                                    showNotification: false,
                                    extra: { volumeId: album.VolumeID, shareId: album.ShareID, linkId: album.LinkID },
                                });
                                showErrorNotification = true;
                            }
                        })
                    );

                    if (showErrorNotification) {
                        createNotification({
                            type: 'error',
                            text: c('Error').t`We were not able to load some items shared with you`,
                        });
                    }

                    if (More) {
                        void sharedWithMeCall(AnchorID);
                    }
                }
            };
            return sharedWithMeCall();
        },
        [request, getLink, handleError, createNotification]
    );

    const populateNodesFromLegacy = useCallback(async () => {
        const { setSharedWithMeItem, cleanupStaleItems } = useSharedWithMeListingStore.getState();
        const loadedUids = new Set<string>();
        let showErrorNotification = false;
        const nodesToProcess = cachedLinks.map((legacyNode) => {
            const uid = generateNodeUid(legacyNode.volumeId, legacyNode.linkId);
            return {
                ...legacyNode,
                id: uid,
                uid,
                isLegacy: true,
                thumbnailId: legacyNode.activeRevision?.id || uid,
            };
        });

        const loadSharedInfoPromises = nodesToProcess.map((missingNode) => {
            const shareId = missingNode.shareId || missingNode.rootShareId;
            if (!shareId) {
                handleError(new EnrichedError("The node to process don't have shareId or rootShareId"), {
                    showNotification: false,
                });
                return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
                try {
                    loadSharedInfo(shareId, (sharedInfo) => {
                        try {
                            if (!sharedInfo) {
                                console.warn(
                                    'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                                    { uid: missingNode.uid, shareId }
                                );
                                return;
                            }
                            let nodeType = NodeType.Album;
                            if (missingNode.type === LinkType.FILE) {
                                nodeType = NodeType.File;
                            } else if (missingNode.type === LinkType.FOLDER) {
                                nodeType = NodeType.Folder;
                            }

                            loadedUids.add(missingNode.uid);
                            setSharedWithMeItem({
                                nodeUid: missingNode.uid,
                                name: missingNode.name,
                                type: nodeType,
                                mediaType: missingNode.mimeType,
                                itemType: ItemType.DIRECT_SHARE,
                                thumbnailId: missingNode.thumbnailId,
                                size: missingNode.size,
                                directShare: {
                                    sharedOn: new Date(sharedInfo.sharedOn * 1000),
                                    sharedBy: sharedInfo.sharedBy,
                                },
                                haveSignatureIssues:
                                    !missingNode.isAnonymous &&
                                    Boolean(
                                        missingNode.signatureIssues &&
                                            Object.values(missingNode.signatureIssues).some(Boolean)
                                ),
                                legacy: {
                                    isFromLegacy: true,
                                    linkId: missingNode.linkId,
                                    shareId,
                                    volumeId: missingNode.volumeId,
                                },
                            });
                        } catch (e) {
                            handleError(e, { showNotification: false });
                            showErrorNotification = true;
                        } finally {
                            resolve();
                        }
                    });
                } catch (e) {
                    handleError(e, { showNotification: false });
                    showErrorNotification = true;
                    resolve();
                }
            });
        });

        await Promise.all(loadSharedInfoPromises);
        cleanupStaleItems(ItemType.DIRECT_SHARE, loadedUids, { legacyCleanup: true });

        if (showErrorNotification) {
            createNotification({
                type: 'error',
                text: c('Error').t`We were not able to load some of your invitations`,
            });
        }
    }, [cachedLinks, loadSharedInfo, handleError, createNotification]);

    const populateInvitationsFromLegacy = useCallback(() => {
        const { setSharedWithMeItem, cleanupStaleItems } = useSharedWithMeListingStore.getState();
        const loadedUids = new Set<string>();
        let showErrorNotification = false;

        invitations.forEach((invitation) => {
            try {
                const uid = generateNodeUid(invitation.share.volumeId, invitation.link.linkId);
                const invitationUid = generateNodeUid(invitation.share.shareId, invitation.invitation.invitationId);
                let nodeType = NodeType.Album;
                if (invitation.link.type === LinkType.FILE) {
                    nodeType = NodeType.File;
                } else if (invitation.link.type === LinkType.FOLDER) {
                    nodeType = NodeType.Folder;
                }

                loadedUids.add(uid);
                setSharedWithMeItem({
                    nodeUid: uid,
                    name: invitation.decryptedLinkName || '',
                    type: nodeType,
                    mediaType: invitation.link.mimeType,
                    itemType: ItemType.INVITATION,
                    thumbnailId: undefined,
                    size: undefined,
                    invitation: {
                        uid: invitationUid,
                        sharedBy: invitation.invitation.inviterEmail,
                    },
                    legacy: {
                        isFromLegacy: true,
                        linkId: invitation.link.linkId,
                        shareId: invitation.share.shareId,
                        volumeId: invitation.share.volumeId,
                    },
                });
            } catch (e) {
                handleError(e, { showNotification: false });
                showErrorNotification = true;
            }
        });

        cleanupStaleItems(ItemType.INVITATION, loadedUids, { legacyCleanup: true });

        if (showErrorNotification) {
            createNotification({
                type: 'error',
                text: c('Error').t`We were not able to load some of your invitations`,
            });
        }
    }, [invitations, handleError, createNotification]);

    useEffect(() => {
        const { isPopulatingLegacyNodes, setPopulatingLegacyNodes } = useSharedWithMeListingStore.getState();

        if (cachedLinks.length === 0 || isPopulatingLegacyNodes) {
            return;
        }

        const runPopulate = async () => {
            setPopulatingLegacyNodes(true);
            await populateNodesFromLegacy();
            setPopulatingLegacyNodes(false);
        };

        void runPopulate();
    }, [populateNodesFromLegacy, cachedLinks]);

    useEffect(() => {
        const { isPopulatingLegacyInvitations, setPopulatingLegacyInvitations } =
            useSharedWithMeListingStore.getState();

        if (invitations.length === 0 || isPopulatingLegacyInvitations) {
            return;
        }

        setPopulatingLegacyInvitations(true);
        populateInvitationsFromLegacy();
        setPopulatingLegacyInvitations(false);
    }, [populateInvitationsFromLegacy, invitations]);

    const handleLoadLegacySharedWithMeAlbums = useCallback(
        async (abortSignal: AbortSignal) => {
            const { isLoadingLegacyNodes, setLoadingLegacyNodes } = useSharedWithMeListingStore.getState();
            if (isLoadingLegacyNodes) {
                return;
            }
            setLoadingLegacyNodes(true);
            await loadLegacySharedWithMeAlbums(abortSignal);
            setLoadingLegacyNodes(false);
        },
        // loadLegacySharedWithMeAlbums is not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const loadLegacyInvitations = useCallback(
        async (abortSignal: AbortSignal) => {
            const { isLoadingLegacyInvitations, setLoadingLegacyInvitations } = useSharedWithMeListingStore.getState();
            if (isLoadingLegacyInvitations) {
                return;
            }
            setLoadingLegacyInvitations(true);
            await loadInvitations(abortSignal, ShareTargetType.Album);
            setLoadingLegacyInvitations(false);
        },
        // loadInvitations is not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return {
        loadLegacySharedWithMeAlbums: handleLoadLegacySharedWithMeAlbums,
        loadLegacyInvitations: loadLegacyInvitations,
        populateNodesFromLegacy,
        populateInvitationsFromLegacy,
    };
};
