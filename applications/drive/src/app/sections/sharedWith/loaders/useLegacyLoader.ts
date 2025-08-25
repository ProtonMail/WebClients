import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';
import { NodeType } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';
import { querySharedWithMeAlbums } from '@proton/shared/lib/api/drive/photos';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ShareTargetType } from '@proton/shared/lib/interfaces/drive/sharing';

import { type Album } from '../../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { useDebouncedRequest } from '../../../store/_api';
import { useInvitationsListing } from '../../../store/_invitations';
import { type DecryptedLink, useLink } from '../../../store/_links';
import { useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { sendErrorReport } from '../../../utils/errorHandling';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';

export const useLegacyLoader = () => {
    const { handleError } = useSdkErrorHandler();
    const { loadSharedInfo } = useSharedInfoBatcher();

    // Moved from useLegacySharedWithMeNodes
    const [isLoading, withLoading] = useLoading(true);
    const [isInvitationsLoading, withInvitationsLoading] = useLoading(true);
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
                    await Promise.all(
                        Albums.map(async (album) => {
                            try {
                                if (album.ShareID === null) {
                                    return;
                                }

                                const link = await getLink(abortSignal, album.ShareID, album.LinkID);
                                setAlbums((prevAlbums) => [...prevAlbums, link]);
                            } catch (e) {
                                sendErrorReport(e);
                            }
                        })
                    );

                    if (More) {
                        void sharedWithMeCall(AnchorID);
                    }
                }
            };
            return sharedWithMeCall();
        },
        [getLink, request]
    );

    const populateNodesFromLegacy = useCallback(() => {
        const { setLoadingLegacyNodes, isLoadingLegacyNodes, setSharedWithMeItem, cleanupStaleItems } =
            useSharedWithMeListingStore.getState();
        if (cachedLinks.length === 0 || isLoadingLegacyNodes) {
            return;
        }

        setLoadingLegacyNodes(true);
        try {
            const loadedUids = new Set<string>();
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

            nodesToProcess.forEach((missingNode) => {
                const shareId = missingNode.shareId || missingNode.rootShareId;
                if (shareId) {
                    loadSharedInfo(shareId, (sharedInfo) => {
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
                            legacy: {
                                isFromLegacy: true,
                                linkId: missingNode.linkId,
                                shareId,
                                volumeId: missingNode.volumeId,
                            },
                        });
                    });
                }
            });
            cleanupStaleItems(ItemType.DIRECT_SHARE, loadedUids, { legacyCleanup: true });
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`We were not able some of your shared items` });
        } finally {
            setLoadingLegacyNodes(false);
        }
        // cachedLinks is not stable, we should ignore it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadSharedInfo, handleError]);

    const populateInvitationsFromLegacy = useCallback(() => {
        const { setLoadingLegacyInvitations, isLoadingLegacyInvitations, setSharedWithMeItem, cleanupStaleItems } =
            useSharedWithMeListingStore.getState();
        if (cachedLinks.length === 0 || isLoadingLegacyInvitations) {
            return;
        }

        setLoadingLegacyInvitations(true);
        try {
            const loadedUids = new Set<string>();
            invitations.forEach((invitation) => {
                const uid = generateNodeUid(invitation.share.volumeId, invitation.link.linkId);
                let nodeType = NodeType.Album;
                if (invitation.link.type === LinkType.FILE) {
                    nodeType = NodeType.File;
                } else if (invitation.link.type === LinkType.FOLDER) {
                    nodeType = NodeType.Folder;
                }

                loadedUids.add(invitation.invitation.invitationId);
                setSharedWithMeItem({
                    nodeUid: uid,
                    name: invitation.decryptedLinkName || '',
                    type: nodeType,
                    mediaType: invitation.link.mimeType,
                    itemType: ItemType.INVITATION,
                    thumbnailId: undefined,
                    size: undefined,
                    invitation: {
                        uid: invitation.invitation.invitationId,
                        sharedBy: invitation.invitation.inviterEmail,
                    },
                    legacy: {
                        isFromLegacy: true,
                        linkId: invitation.link.linkId,
                        shareId: invitation.share.shareId,
                        volumeId: invitation.share.volumeId,
                    },
                });
            });

            cleanupStaleItems(ItemType.INVITATION, loadedUids, { legacyCleanup: true });
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`We were not able some of your shared items` });
        } finally {
            setLoadingLegacyInvitations(false);
        }
        // invitations is not stable, we should ignore it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleError]);

    const loadLegacySharedWithMeAlbumsWithPopulate = useCallback(
        async (abortSignal: AbortSignal) => {
            await loadLegacySharedWithMeAlbums(abortSignal);
            populateNodesFromLegacy();
        },
        // loadLegacySharedWithMeAlbums and populateNodesFromLegacy are not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const loadLegacyInvitationsWithPopulate = useCallback(
        async (abortSignal: AbortSignal) => {
            try {
                await loadInvitations(abortSignal, ShareTargetType.Album);
                populateInvitationsFromLegacy();
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able some of your shared items` });
            }
        },
        // loadInvitations and populateInvitationsFromLegacy are not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [handleError]
    );

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadLegacySharedWithMeAlbumsWithPopulate(ac.signal).catch(sendErrorReport));
        return () => {
            ac.abort();
        };
        // loadLegacySharedWithMeAlbumsWithPopulate and withLoading are not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        void withInvitationsLoading(loadLegacyInvitationsWithPopulate(ac.signal).catch(sendErrorReport));
        return () => {
            ac.abort();
        };
        // loadLegacyInvitationsWithPopulate and withInvitationsLoading are not stable, we should ignore them
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        isLegacyLoading: isLoading || isInvitationsLoading,
        loadLegacySharedWithMeAlbums: loadLegacySharedWithMeAlbumsWithPopulate,
        loadLegacyInvitations: loadLegacyInvitationsWithPopulate,
        populateNodesFromLegacy,
        populateInvitationsFromLegacy,
    };
};
