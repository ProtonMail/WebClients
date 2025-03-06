import type { FC } from 'react';
import React, { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Loader, useAppTitle, useModalStateObject } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { AlbumTag, useThumbnailsDownload } from '../../store';
import { sendErrorReport } from '../../utils/errorHandling';
import { useCreateAlbum, useRenameAlbum } from '../PhotosActions/Albums';
import { CreateAlbumModal } from '../PhotosModals/CreateAlbumModal';
import { RenameAlbumModal } from '../PhotosModals/RenameAlbumModal';
import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { AlbumsInvitations } from './AlbumsInvitations';
import { EmptyAlbums } from './EmptyAlbums';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsGallery } from './toolbar/PhotosWithAlbumsToolbar';

import './BannerInvite.scss';

const filterAlbums = (albums: DecryptedAlbum[], userAddress: string | undefined, tag: AlbumTag): DecryptedAlbum[] => {
    if (!userAddress) {
        if (albums.length) {
            sendErrorReport(new Error('Attempting to filter without owner address'));
        }
        return albums;
    }
    if (tag === AlbumTag.Shared) {
        return albums.filter((album) => album.isShared && album.signatureEmail === userAddress);
    }
    if (tag === AlbumTag.MyAlbums) {
        return albums.filter((album) => album.signatureEmail === userAddress);
    }
    if (tag === AlbumTag.SharedWithMe) {
        return albums.filter((album) => album.isShared && album.signatureEmail !== userAddress);
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
        userAddressEmail,
        loadPhotoLink,
        requestDownload,
        refreshAlbums,
    } = usePhotosWithAlbumsView();

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const createAlbumModal = useModalStateObject();
    const renameAlbumModal = useModalStateObject();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const createAlbum = useCreateAlbum();
    const renameAlbum = useRenameAlbum();
    const [renameAlbumLinkId, setRenameAlbumLinkId] = useState<string>('');

    const thumbnails = useThumbnailsDownload();
    const { navigateToPhotos, navigateToAlbum, navigateToAlbums } = useNavigate();
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
        [incrementItemRenderedCounter, loadPhotoLink]
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

    const onCreateAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                navigateToAlbum(shareId, albumLinkId);
            } catch (e) {
                sendErrorReport(e);
                console.error('album creation failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    const onRenameAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !volumeId || !renameAlbumLinkId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await renameAlbum(abortSignal, volumeId, shareId, renameAlbumLinkId, name);
                setRenameAlbumLinkId('');
                refreshAlbums();
            } catch (e) {
                sendErrorReport(e);
            }
        },
        [shareId, volumeId, renameAlbumLinkId, renameAlbum]
    );

    const isAlbumsEmpty = albums.length === 0;
    const filteredAlbums = filterAlbums(albums, userAddressEmail, selectedTags[0]);

    if (!shareId || !linkId || isPhotosLoading || isAlbumsLoading) {
        return <Loader />;
    }

    return (
        <>
            {linkSharingModal}

            <ToolbarRow
                withBorder={false}
                withPadding={false}
                className="m-2 toolbar-row--no-responsive"
                titleArea={
                    <>
                        <ToolbarLeftActionsGallery
                            onGalleryClick={navigateToPhotos}
                            onAlbumsClick={navigateToAlbums}
                            isLoading={isPhotosLoading}
                            selection={'albums'}
                        />
                    </>
                }
                toolbar={
                    <PhotosWithAlbumsToolbar
                        shareId={shareId}
                        linkId={linkId}
                        data={albums}
                        selectedItems={[]}
                        requestDownload={requestDownload}
                        uploadDisabled={true}
                        tabSelection={'albums'}
                        createAlbumModal={createAlbumModal}
                    />
                }
            />

            {!isAlbumsEmpty && (
                <AlbumsTags
                    selectedTags={selectedTags}
                    tags={[AlbumTag.All, AlbumTag.MyAlbums, AlbumTag.Shared, AlbumTag.SharedWithMe]}
                    onTagSelect={setSelectedTags}
                />
            )}

            <AlbumsInvitations />

            {isAlbumsEmpty ? (
                <>
                    <EmptyAlbums createAlbumModal={createAlbumModal} />
                </>
            ) : (
                <AlbumsGrid
                    data={filteredAlbums}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={false} // TODO: Get Albums loading status
                    onItemClick={(shareId, linkId) => {
                        navigateToAlbum(shareId, linkId);
                    }}
                    onItemShare={(linkId) => {
                        showLinkSharingModal({ shareId, linkId });
                    }}
                    onItemRename={(linkId) => {
                        setRenameAlbumLinkId(linkId);
                        renameAlbumModal.openModal(true);
                    }}
                />
            )}

            <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} />
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
