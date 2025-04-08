import type { FC } from 'react';
import React, { useCallback, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useModalStateObject, useNotifications } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { AlbumTag, useThumbnailsDownload } from '../../store';
import { useLinksActions } from '../../store/_links';
import { sendErrorReport } from '../../utils/errorHandling';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { useRenameAlbum } from '../PhotosActions/Albums';
import { RenameAlbumModal } from '../PhotosModals/RenameAlbumModal';
import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { AlbumsInvitations } from './AlbumsInvitations';
import { EmptyAlbums } from './EmptyAlbums';
import { EmptyTagView } from './EmptyTagView';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';

import './BannerInvite.scss';

const filterAlbums = (albums: DecryptedAlbum[], tag: AlbumTag): DecryptedAlbum[] => {
    if (tag === AlbumTag.Shared) {
        return albums.filter((album) => album.sharingDetails?.shareId && album.permissions.isOwner);
    }
    if (tag === AlbumTag.MyAlbums) {
        return albums.filter((album) => album.permissions.isOwner);
    }
    if (tag === AlbumTag.SharedWithMe) {
        return albums.filter((album) => album.sharingDetails?.shareId && !album.permissions.isOwner);
    }
    return albums;
};

export const AlbumsView: FC = () => {
    useAppTitle(c('Title').t`Albums`);
    const {
        volumeId,
        shareId,
        linkId,
        albums,
        isPhotosLoading,
        isAlbumsLoading,
        loadPhotoLink,
        deleteAlbum,
        refreshSharedWithMeAlbums,
    } = usePhotosWithAlbumsView();

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const { modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            modals: state.modals,
        }))
    );
    const renameAlbumModal = useModalStateObject();
    const renameAlbum = useRenameAlbum();
    const [renameAlbumLinkId, setRenameAlbumLinkId] = useState<string>('');
    const { moveLinks } = useLinksActions();
    const { createNotification } = useNotifications();

    const thumbnails = useThumbnailsDownload();
    const { navigateToAlbum, navigateToAlbums } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTags, setSelectedTags] = useState<AlbumsTagsProps['selectedTags']>([AlbumTag.All]);

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            if (!shareId) {
                return;
            }
            incrementItemRenderedCounter();
            const album = albums.find((album) => album.linkId === itemLinkId);
            if (album && album.rootShareId) {
                loadPhotoLink(album.rootShareId, itemLinkId, domRef);
            } else {
                loadPhotoLink(shareId, itemLinkId, domRef);
            }
        },
        [incrementItemRenderedCounter, loadPhotoLink, albums, shareId]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            const album = albums.find((album) => album.linkId === itemLinkId);
            if (album && album.rootShareId) {
                thumbnails.addToDownloadQueue(album.rootShareId, itemLinkId, undefined, domRef);
            } else {
                thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
            }
        }
    };

    const onRenameAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !volumeId || !renameAlbumLinkId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await renameAlbum(abortSignal, volumeId, shareId, renameAlbumLinkId, name);
            } catch (e) {
                sendErrorReport(e);
            } finally {
                setRenameAlbumLinkId('');
            }
        },
        [shareId, volumeId, renameAlbumLinkId, renameAlbum]
    );

    const handleDeleteAlbum = useCallback(
        async (
            abortSignal: AbortSignal,
            album: DecryptedAlbum,
            { missingPhotosIds, force }: { missingPhotosIds: string[]; force: boolean }
        ) => {
            if (!linkId) {
                return;
            }
            try {
                if (!force) {
                    await moveLinks(abortSignal, {
                        shareId: album.rootShareId,
                        linkIds: missingPhotosIds,
                        newShareId: shareId,
                        newParentLinkId: linkId,
                    });
                }
                await deleteAlbum(abortSignal, album.linkId, force);
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
            const albumName = album.name;
            createNotification({
                text: c('Info').t`${albumName} has been successfully deleted`,
            });
        },
        [linkId, createNotification, deleteAlbum, moveLinks, shareId]
    );

    // For delete album we do the happy path and just compare with photos you have in cache.
    // In most cases, if user have all the photos in his library will mean there are no direct children inside the album
    // There is a fallback in the modal in case BE detect that some items are direct children of the album
    const onDeleteAlbum = useCallback(
        async (album: DecryptedAlbum) => {
            const abortSignal = new AbortController().signal;
            void modals.deleteAlbum?.({
                missingPhotosCount: album.photoCount,
                name: album.name,
                deleteAlbum: (force, childLinkIds) =>
                    // childLinkIds are from BE, so this is a better source of truth compare to missingPhotosIds
                    handleDeleteAlbum(abortSignal, album, { missingPhotosIds: childLinkIds || [], force }),
                onDeleted: () => {
                    navigateToAlbums();
                },
            });
        },
        [handleDeleteAlbum, navigateToAlbums, modals]
    );

    const isAlbumsEmpty = albums.length === 0;
    const filteredAlbums = filterAlbums(albums, selectedTags[0]);

    if (!shareId || !linkId || (isAlbumsLoading && !albums) || (isAlbumsLoading && albums.length === 0)) {
        return <Loader />;
    }

    const isSelectedTagEmtpy = !isAlbumsEmpty && filteredAlbums.length === 0;

    return (
        <>
            {!isAlbumsEmpty && (
                <AlbumsTags
                    selectedTags={selectedTags}
                    tags={[AlbumTag.All, AlbumTag.MyAlbums, AlbumTag.Shared, AlbumTag.SharedWithMe]}
                    onTagSelect={setSelectedTags}
                />
            )}

            <AlbumsInvitations refreshSharedWithMeAlbums={refreshSharedWithMeAlbums} />
            {isSelectedTagEmtpy && <EmptyTagView tag={selectedTags[0]} />}
            {isAlbumsEmpty && <EmptyAlbums createAlbumModal={modals.createAlbum} />}
            {!isAlbumsEmpty && !isSelectedTagEmtpy && (
                <AlbumsGrid
                    data={filteredAlbums}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isAlbumsLoading}
                    onItemClick={(shareId, linkId) => {
                        navigateToAlbum(shareId, linkId);
                    }}
                    onItemShare={(linkId) => {
                        modals.linkSharing?.({ shareId, linkId });
                    }}
                    onItemRename={(linkId) => {
                        setRenameAlbumLinkId(linkId);
                        renameAlbumModal.openModal(true);
                    }}
                    onItemDelete={onDeleteAlbum}
                />
            )}
            {renameAlbumLinkId && (
                <RenameAlbumModal
                    name={filteredAlbums.find((album) => album.linkId === renameAlbumLinkId)?.name}
                    renameAlbumModal={renameAlbumModal}
                    renameAlbum={onRenameAlbum}
                />
            )}
        </>
    );
};
