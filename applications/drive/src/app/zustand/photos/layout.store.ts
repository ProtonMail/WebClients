import { create } from 'zustand';

import type { ModalStateReturnObj } from '@proton/components';

import type { DeleteAlbumModalProps } from '../../photos/PhotosModals/DeleteAlbumModal';

export enum AlbumsPageTypes {
    GALLERY = 'GALLERY',
    ALBUMS = 'ALBUMS',
    ALBUMSGALLERY = 'ALBUMSGALLERY',
    // This view will be the GALLERY view without the GALLERY UI but with album pathname.
    // It allows easily to have all photos in order to add them to the album
    ALBUMSADDPHOTOS = 'ALBUMSADDPHOTOS',
}
interface Modals {
    // Sharing modal props should not be exposed, added `any` because this file will be removed soon
    linkSharing?: (props: any) => void;
    deleteAlbum?: (props: DeleteAlbumModalProps) => void;
    createAlbum?: ModalStateReturnObj;
}
interface PhotoLayoutStore {
    currentPageType: AlbumsPageTypes | undefined;
    previewNodeUid: string | undefined;
    modals: Modals;
    setPageType: (pageType: AlbumsPageTypes) => void;
    setPreviewNodeUid: (previewNodeUid: string | undefined) => void;
    setLayoutModals: (modals: Modals) => void;
}

export const usePhotoLayoutStore = create<PhotoLayoutStore>((set) => ({
    currentPageType: undefined,
    previewNodeUid: undefined,
    modals: {
        linkSharing: undefined,
    },
    setPageType: (pageType: AlbumsPageTypes) => set((state) => ({ ...state, currentPageType: pageType })),
    setPreviewNodeUid: (previewNodeUid: string | undefined) => set((state) => ({ ...state, previewNodeUid })),
    setLayoutModals: (modals: Modals) => set((state) => ({ ...state, modals })),
}));
