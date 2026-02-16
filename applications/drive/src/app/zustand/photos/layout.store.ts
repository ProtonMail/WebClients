import { create } from 'zustand';

import type { ModalStateReturnObj } from '@proton/components';

import type { SharingModalInnerProps } from '../../modals/SharingModal/useSharingModalState';
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
    linkSharing?: (props: SharingModalInnerProps) => void;
    deleteAlbum?: (props: DeleteAlbumModalProps) => void;
    createAlbum?: ModalStateReturnObj;
}
interface PhotoLayoutStore {
    currentPageType: AlbumsPageTypes | undefined;
    previewLinkId: string | undefined;
    modals: Modals;
    setPageType: (pageType: AlbumsPageTypes) => void;
    setPreviewLinkId: (previewLinkId: string | undefined) => void;
    setLayoutModals: (modals: Modals) => void;
}

export const usePhotoLayoutStore = create<PhotoLayoutStore>((set) => ({
    currentPageType: undefined,
    previewLinkId: undefined,
    modals: {
        linkSharing: undefined,
    },
    setPageType: (pageType: AlbumsPageTypes) => set((state) => ({ ...state, currentPageType: pageType })),
    setPreviewLinkId: (previewLinkId: string | undefined) => set((state) => ({ ...state, previewLinkId })),
    setLayoutModals: (modals: Modals) => set((state) => ({ ...state, modals })),
}));
