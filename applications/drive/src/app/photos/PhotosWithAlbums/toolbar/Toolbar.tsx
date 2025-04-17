import type { ModalStateReturnObj } from '@proton/components';

import type { OnFileUploadSuccessCallbackData, PhotoGridItem, PhotoLink } from '../../../store';
import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosToolbar } from './PhotosAddAlbumPhotosToolbar';
import { PhotosWithAlbumsToolbar } from './PhotosWithAlbumsToolbar';

interface ToolbarProps {
    currentPageType: AlbumsPageTypes;
    previewShareId: string;
    uploadLinkId: string;
    selectedCount: number;
    uploadDisabled: boolean;
    canRemoveSelectedPhotos: boolean;

    albums: PhotoGridItem[];
    album: DecryptedAlbum | undefined;
    albumPhotos: PhotoGridItem[];
    photos: PhotoGridItem[];
    selectedItems: PhotoLink[];

    createAlbumModal: ModalStateReturnObj;
    requestDownload: (linkIds: string[]) => Promise<void>;
    onAddAlbumPhotos: () => Promise<void>;
    openAddPhotosToAlbumModal: () => void;
    openSharePhotosIntoAnAlbumModal: () => void;
    onFileUpload: ((file: OnFileUploadSuccessCallbackData) => void) | undefined;
    onPreview: () => void;
    onSelectCover: () => Promise<void>;
    onDeleteAlbum: () => void;
    onLeaveAlbum: () => void;
    onShowDetails: () => void;
    onRemoveAlbumPhotos: () => Promise<void>;
}

export const Toolbar = ({
    currentPageType,
    previewShareId,
    uploadLinkId,
    selectedCount,
    uploadDisabled,
    canRemoveSelectedPhotos,
    albums,
    album,
    albumPhotos,
    photos,
    selectedItems,
    createAlbumModal,
    requestDownload,
    onAddAlbumPhotos,
    openAddPhotosToAlbumModal,
    openSharePhotosIntoAnAlbumModal,
    onFileUpload,
    onPreview,
    onSelectCover,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onRemoveAlbumPhotos,
}: ToolbarProps) => {
    switch (currentPageType) {
        case AlbumsPageTypes.ALBUMS:
            return (
                <PhotosWithAlbumsToolbar
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    data={albums}
                    selectedItems={[]}
                    requestDownload={requestDownload}
                    uploadDisabled={true}
                    tabSelection={AlbumsPageTypes.ALBUMS}
                    createAlbumModal={createAlbumModal}
                />
            );
        case AlbumsPageTypes.ALBUMSADDPHOTOS:
            return (
                <PhotosAddAlbumPhotosToolbar
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    selectedCount={selectedCount}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                />
            );
        default:
            return (
                <PhotosWithAlbumsToolbar
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    album={album}
                    selectedItems={selectedItems}
                    onPreview={onPreview}
                    requestDownload={requestDownload}
                    data={AlbumsPageTypes.ALBUMSGALLERY ? albumPhotos : photos}
                    uploadDisabled={uploadDisabled}
                    tabSelection={currentPageType}
                    createAlbumModal={createAlbumModal}
                    onFileUpload={onFileUpload}
                    onFileSkipped={onFileUpload}
                    removeAlbumPhotos={canRemoveSelectedPhotos ? onRemoveAlbumPhotos : undefined}
                    onSelectCover={onSelectCover}
                    onDeleteAlbum={onDeleteAlbum}
                    onLeaveAlbum={onLeaveAlbum}
                    onShowDetails={onShowDetails}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    openAddPhotosToAlbumModal={openAddPhotosToAlbumModal}
                    openSharePhotosIntoAnAlbumModal={openSharePhotosIntoAnAlbumModal}
                />
            );
    }
};
