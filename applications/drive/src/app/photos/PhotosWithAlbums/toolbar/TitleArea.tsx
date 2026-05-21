import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { getDriveForPhotos } from '@proton/drive/index';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import useNavigate from '../../../legacy/hooks/drive/useNavigate';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../legacy/zustand/photos/layout.store';
import { getEllipsedName } from '../../../utils/intl/getEllipsedName';
import { useAlbumsStore } from '../../useAlbums.store';
import { PhotosClearSelectionButton } from '../components/PhotosClearSelectionButton';
import { usePhotosSelection } from '../hooks/usePhotosSelection';
import { ToolbarLeftActionsAlbumsGallery, ToolbarLeftActionsGallery } from './PhotosWithAlbumsToolbar';

export const TitleArea = ({
    isAlbumsLoading,
    isPhotosLoading,
    photoTimelineUids,
    albumPhotoTimelineUids,
}: {
    isAlbumsLoading: boolean;
    isPhotosLoading: boolean;
    photoTimelineUids: Set<string>;
    albumPhotoTimelineUids: Set<string> | undefined;
}) => {
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );
    const { navigateToAlbums, navigateToNodeUid, navigateToPhotos } = useNavigate();

    const { selectedItems, clearSelection } = usePhotosSelection({
        photoTimelineUids,
        albumPhotoTimelineUids,
    });

    const album = useAlbumsStore(
        useShallow((state) => {
            return state.currentAlbumNodeUid ? state.albums.get(state.currentAlbumNodeUid) : undefined;
        })
    );

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
    const ellipsedAlbumName = getEllipsedName(albumName ?? '');
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
                            if (album) {
                                void navigateToNodeUid(album.nodeUid, getDriveForPhotos());
                            }
                        }}
                    >
                        <IcArrowLeft className="mr-2 shrink-0" />{' '}
                        {c('Action').t`Go back to album "${ellipsedAlbumName}"`}
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
