import type { ModalStateReturnObj } from '@proton/components';

import { AlbumsPageTypes } from '../../../zustand/photos/layout.store';
import type { PhotoItem } from '../../usePhotos.store';
import { PhotosAddAlbumPhotosToolbar } from './PhotosAddAlbumPhotosToolbar';
import { PhotosWithAlbumsToolbar } from './PhotosWithAlbumsToolbar';

interface ToolbarProps {
    currentPageType: AlbumsPageTypes;
    rootNodeUid?: string;
    selectedCount: number;
    uploadDisabled: boolean;
    canRemoveSelectedPhotos: boolean;

    albumsUids: string[];
    albumUid: string | undefined;
    uids: string[];
    selectedItems: PhotoItem[];

    createAlbumModal: ModalStateReturnObj;
    requestDownload: (photosUids: string[]) => Promise<void>;
    onAddAlbumPhotos: () => Promise<void>;
    onUploadStart?: () => void;
    openAddPhotosToAlbumModal: () => void;
    openSharePhotosIntoAnAlbumModal: () => void;
    openSharePhotoModal: () => void;
    onPreview: () => void;
    onSelectCover: () => Promise<void>;
    onDeleteAlbum: () => void;
    onLeaveAlbum: () => void;
    onShowDetails: () => void;
    onRemoveAlbumPhotos: () => Promise<void>;
    onSavePhotos?: () => Promise<void>;
    isAlbumPhotosLoading?: boolean;
}

export const Toolbar = ({
    currentPageType,
    rootNodeUid,
    selectedCount,
    uploadDisabled,
    canRemoveSelectedPhotos,
    albumsUids,
    albumUid,
    uids,
    selectedItems,
    createAlbumModal,
    requestDownload,
    onAddAlbumPhotos,
    onUploadStart,
    openAddPhotosToAlbumModal,
    openSharePhotosIntoAnAlbumModal,
    openSharePhotoModal,
    onPreview,
    onSelectCover,
    onDeleteAlbum,
    onLeaveAlbum,
    onShowDetails,
    onRemoveAlbumPhotos,
    onSavePhotos,
    isAlbumPhotosLoading,
}: ToolbarProps) => {
    switch (currentPageType) {
        case AlbumsPageTypes.ALBUMS:
            return (
                <PhotosWithAlbumsToolbar
                    uids={albumsUids}
                    selectedItems={[]}
                    albumNodeUid={albumUid}
                    requestDownload={requestDownload}
                    uploadDisabled={true}
                    tabSelection={AlbumsPageTypes.ALBUMS}
                    createAlbumModal={createAlbumModal}
                />
            );
        case AlbumsPageTypes.ALBUMSADDPHOTOS:
            return (
                <PhotosAddAlbumPhotosToolbar
                    selectedCount={selectedCount}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    onUploadStart={onUploadStart}
                    albumNodeUid={albumUid}
                />
            );
        default:
            return (
                <PhotosWithAlbumsToolbar
                    albumNodeUid={albumUid}
                    selectedItems={selectedItems}
                    onPreview={onPreview}
                    requestDownload={requestDownload}
                    uids={uids}
                    uploadDisabled={uploadDisabled}
                    tabSelection={currentPageType}
                    createAlbumModal={createAlbumModal}
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
                    rootNodeUid={rootNodeUid}
                    isAlbumPhotosLoading={isAlbumPhotosLoading}
                />
            );
    }
};
