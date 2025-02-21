import type { FC } from 'react';
import React, { useCallback, useState } from 'react';

import { c, msgid } from 'ttag';

import { Loader, useAppTitle, useModalStateObject } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { AlbumTag, useThumbnailsDownload } from '../../store';
import { useCreateAlbum } from '../PhotosActions/Albums';
import { CreateAlbumModal } from '../PhotosModals/CreateAlbumModal';
import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { EmptyAlbums } from './EmptyAlbums';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsGallery } from './toolbar/PhotosWithAlbumsToolbar';

// TODO: Move in separate file once it's completed
const filterAlbums = (albums: DecryptedAlbum[], tag: AlbumTag): DecryptedAlbum[] => {
    if (tag === AlbumTag.Shared) {
        return albums.filter((album) => album.isShared);
    }
    if (tag === AlbumTag.MyAlbums) {
        // TODO: Reverse of Shared With Me (everything else)
        return albums;
    }
    if (tag === AlbumTag.SharedWithMe) {
        // TODO: Shared With Me (comes from Api Call)
        return albums;
    }
    return albums;
};

export const AlbumsView: FC = () => {
    useAppTitle(c('Title').t`Albums`);
    const {
        volumeId,
        shareId,
        linkId,
        photos,
        albums,
        isPhotosLoading,
        loadPhotoLink,
        photoLinkIdToIndexMap,
        requestDownload,
    } = usePhotosWithAlbumsView();

    const { selectedItems, clearSelection } = usePhotosSelection(photos, photoLinkIdToIndexMap);
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const createAlbumModal = useModalStateObject();
    // TODO: [linkSharingModal, showLinkSharingModal] enable link sharing modal for albums
    const [linkSharingModal] = useLinkSharingModal();
    const createAlbum = useCreateAlbum();

    const thumbnails = useThumbnailsDownload();
    const { navigateToPhotos, navigateToAlbum, navigateToAlbums } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTags, setSelectedTags] = useState<AlbumsTagsProps['selectedTags']>([AlbumTag.All]);

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            incrementItemRenderedCounter();
            loadPhotoLink(itemLinkId, domRef);
        },
        [incrementItemRenderedCounter, loadPhotoLink]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
        }
    };

    const selectedCount = selectedItems.length;

    const onCreateAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                navigateToAlbum(albumLinkId);
            } catch (e) {
                console.error('album creation failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    const isAlbumsEmpty = albums.length === 0;
    const filteredAlbums = filterAlbums(albums, selectedTags[0]);

    if (!shareId || !linkId || isPhotosLoading) {
        return <Loader />;
    }

    return (
        <>
            {linkSharingModal}

            <ToolbarRow
                withBorder={false}
                withPadding={false}
                titleArea={
                    <>
                        {selectedCount > 0 && (
                            <span className="flex items-center text-strong pl-1">
                                <div className="flex gap-2" data-testid="photos-selected-count">
                                    <PhotosClearSelectionButton onClick={clearSelection}>
                                        {/* aria-live & aria-atomic ensure the count gets revocalized when it changes */}
                                        <span aria-live="polite" aria-atomic="true">
                                            {c('Info').ngettext(
                                                msgid`${selectedCount} selected`,
                                                `${selectedCount} selected`,
                                                selectedCount
                                            )}
                                        </span>
                                    </PhotosClearSelectionButton>
                                </div>
                            </span>
                        )}

                        {selectedCount === 0 && (
                            <ToolbarLeftActionsGallery
                                onGalleryClick={() => {
                                    navigateToPhotos();
                                }}
                                onAlbumsClick={() => {
                                    navigateToAlbums();
                                }}
                                isLoading={isPhotosLoading}
                                selection={'albums'}
                            />
                        )}
                    </>
                }
                toolbar={
                    <PhotosWithAlbumsToolbar
                        shareId={shareId}
                        linkId={linkId}
                        data={albums}
                        selectedItems={selectedItems}
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
                    onItemClick={(linkId) => {
                        navigateToAlbum(linkId);
                    }}
                />
            )}

            <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} />
        </>
    );
};
