import { useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

import useNavigate from '../../../hooks/drive/useNavigate';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { PhotosClearSelectionButton } from '../components/PhotosClearSelectionButton';
import { usePhotosSelection } from '../hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from '../layout/PhotosLayout';
import { ToolbarLeftActionsAlbumsGallery, ToolbarLeftActionsGallery } from './PhotosWithAlbumsToolbar';

export const TitleArea = ({
    isAlbumsLoading,
    isPhotosLoading,
    albums,
    photos,
    photoLinkIdToIndexMap,
    albumPhotos,
    albumPhotosLinkIdToIndexMap,
}: Pick<
    PhotosLayoutOutletContext,
    | 'isAlbumsLoading'
    | 'isPhotosLoading'
    | 'albums'
    | 'photos'
    | 'photoLinkIdToIndexMap'
    | 'albumPhotos'
    | 'albumPhotosLinkIdToIndexMap'
>) => {
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );
    const { navigateToAlbums, navigateToAlbum, navigateToPhotos } = useNavigate();

    const { selectedItems, clearSelection } = usePhotosSelection({
        photos,
        photoLinkIdToIndexMap,
        albumPhotos,
        albumPhotosLinkIdToIndexMap,
    });

    const album = useMemo(() => {
        if (!albumLinkId) {
            return undefined;
        }
        return albums.find((album) => album.linkId === albumLinkId);
    }, [albums, albumLinkId]);

    const selectedCount = selectedItems.length;
    const albumName = album?.name;

    if (currentPageType === AlbumsPageTypes.ALBUMS) {
        return (
            <ToolbarLeftActionsGallery
                onGalleryClick={navigateToPhotos}
                onAlbumsClick={navigateToAlbums}
                isLoading={isPhotosLoading}
                selection={'albums'}
            />
        );
    }
    if (currentPageType === AlbumsPageTypes.ALBUMSGALLERY) {
        return (
            <>
                {selectedCount > 0 && (
                    <span className="flex items-center pl-1">
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

                {selectedCount === 0 && albumName && (
                    <ToolbarLeftActionsAlbumsGallery
                        onAlbumsClick={() => {
                            navigateToAlbums();
                        }}
                        name={albumName}
                        isLoading={isAlbumsLoading}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {selectedCount > 0 && (
                <span className="flex items-center pl-1">
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

            {selectedCount === 0 &&
                (currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS ? (
                    <Button
                        shape="ghost"
                        className="inline-flex flex-nowrap flex-row text-semibold items-center"
                        data-testid="toolbar-go-back"
                        onClick={() => {
                            if (!albumShareId || !albumLinkId) {
                                return;
                            }
                            navigateToAlbum(albumShareId, albumLinkId);
                        }}
                    >
                        <Icon name="arrow-left" className="mr-2 shrink-0" />{' '}
                        {c('Action').t`Go back to album “${albumName}“`}
                    </Button>
                ) : (
                    <ToolbarLeftActionsGallery
                        onGalleryClick={() => {
                            navigateToPhotos();
                        }}
                        onAlbumsClick={() => {
                            navigateToAlbums();
                        }}
                        isLoading={isPhotosLoading}
                        selection={'gallery'}
                    />
                ))}
        </>
    );
};
