import type { ModalStateReturnObj } from '@proton/components';

import type { OnFileSkippedSuccessCallbackData, OnFileUploadSuccessCallbackData, PhotoGridItem } from '../../../store';
import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import type { PhotoItem } from '../../usePhotos.store';
import { PhotosAddAlbumPhotosToolbar } from './PhotosAddAlbumPhotosToolbar';
import { PhotosWithAlbumsToolbar } from './PhotosWithAlbumsToolbar';

interface ToolbarProps {
    volumeId: string;
    currentPageType: AlbumsPageTypes;
    previewShareId: string;
    uploadLinkId: string;
    rootLinkId?: string;
    selectedCount: number;
    uploadDisabled: boolean;
    canRemoveSelectedPhotos: boolean;

    albumsUid: string[];
    albumUid: string | undefined;
    albumPhotos: PhotoGridItem[];
    photos: PhotoGridItem[];
    selectedItems: PhotoItem[];

    createAlbumModal: ModalStateReturnObj;
    requestDownload: (photosUids: string[]) => Promise<void>;
    onAddAlbumPhotos: () => Promise<void>;
    openAddPhotosToAlbumModal: () => void;
    openSharePhotosIntoAnAlbumModal: () => void;
    openSharePhotoModal: () => void;
    onFileUpload: ((file: OnFileUploadSuccessCallbackData) => void) | undefined;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onPreview: () => void;
    onSelectCover: () => Promise<void>;
    onDeleteAlbum: () => void;
    onLeaveAlbum: () => void;
    onShowDetails: () => void;
    onRemoveAlbumPhotos: () => Promise<void>;
    onStartUpload: () => void;
    onSavePhotos?: () => Promise<void>;
    isAlbumPhotosLoading?: boolean;
}

export const Toolbar = ({
    volumeId,
    currentPageType,
    previewShareId,
    uploadLinkId,
    rootLinkId,
    selectedCount,
    uploadDisabled,
    canRemoveSelectedPhotos,
    albumsUid,
    albumUid,
    albumPhotos,
    photos,
    selectedItems,
    createAlbumModal,
    requestDownload,
    onAddAlbumPhotos,
    openAddPhotosToAlbumModal,
    openSharePhotosIntoAnAlbumModal,
    openSharePhotoModal,
    onFileUpload,
    onFileSkipped,
    onPreview,
    onSelectCover,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onRemoveAlbumPhotos,
    onSavePhotos,
    onStartUpload,
    isAlbumPhotosLoading,
}: ToolbarProps) => {
    switch (currentPageType) {
        case AlbumsPageTypes.ALBUMS:
            return (
                <PhotosWithAlbumsToolbar
                    volumeId={volumeId}
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    data={albumsUid}
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
                    volumeId={volumeId}
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    selectedCount={selectedCount}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    onStartUpload={onStartUpload}
                    onFileUpload={onFileUpload}
                    onFileSkipped={onFileSkipped}
                />
            );
        default:
            return (
                <PhotosWithAlbumsToolbar
                    volumeId={volumeId}
                    shareId={previewShareId}
                    linkId={uploadLinkId}
                    nodeUid={albumUid}
                    selectedItems={selectedItems}
                    onPreview={onPreview}
                    requestDownload={requestDownload}
                    data={AlbumsPageTypes.ALBUMSGALLERY ? albumPhotos : photos}
                    uploadDisabled={uploadDisabled}
                    tabSelection={currentPageType}
                    createAlbumModal={createAlbumModal}
                    onFileUpload={onFileUpload}
                    removeAlbumPhotos={canRemoveSelectedPhotos ? onRemoveAlbumPhotos : undefined}
                    onSelectCover={onSelectCover}
                    onDeleteAlbum={onDeleteAlbum}
                    onLeaveAlbum={onLeaveAlbum}
                    onShowDetails={onShowDetails}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    openAddPhotosToAlbumModal={openAddPhotosToAlbumModal}
                    openSharePhotosIntoAnAlbumModal={openSharePhotosIntoAnAlbumModal}
                    openSharePhotoModal={openSharePhotoModal}
                    onSavePhotos={onSavePhotos}
                    rootLinkId={rootLinkId}
                    isAlbumPhotosLoading={isAlbumPhotosLoading}
                />
            );
    }
};
