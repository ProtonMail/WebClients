import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { AlbumPhoto } from '../../store';

interface AlbumsPhotosState {
    albumsPhotos: Record<string, AlbumPhoto[]>;
    albumsPhotosCount: Record<string, number>;
    currentAlbumLinkId: string | undefined;

    getAlbumPhotos: (albumLinkId: string) => AlbumPhoto[];
    setAlbumPhotos: (albumLinkId: string, photos: AlbumPhoto[]) => void;
    setAlbumPhotosCount: (albumLinkId: string, count: number) => void;
    addAlbumPhotos: (albumLinkId: string, photos: AlbumPhoto[]) => void;
    removeAlbumPhotos: (albumLinkId: string, linkIds: string[]) => void;
    clearAlbumPhotos: (albumLinkId: string) => void;
    setCurrentAlbumLinkId: (albumLinkId: string | undefined) => void;
    updatePhotoTags: (albumLinkId: string, linkId: string, tags: PhotoTag[]) => void;
    updatePhotoFavorite: (albumLinkId: string, linkId: string, isFavorite: boolean) => void;
}

export const useAlbumsPhotosStore = create<AlbumsPhotosState>()(
    devtools((set, get) => ({
        albumsPhotos: {},
        albumsPhotosCount: {},
        currentAlbumLinkId: undefined,

        getAlbumPhotos: (albumLinkId) => get().albumsPhotos[albumLinkId] || [],

        setAlbumPhotos: (albumLinkId, photos) =>
            set((state) => ({
                albumsPhotos: {
                    ...state.albumsPhotos,
                    [albumLinkId]: photos,
                },
                albumsPhotosCount: {
                    ...state.albumsPhotosCount,
                    [albumLinkId]: photos.length,
                },
            })),

        setAlbumPhotosCount: (albumLinkId, count) =>
            set((state) => ({
                albumsPhotosCount: {
                    ...state.albumsPhotosCount,
                    [albumLinkId]: count,
                },
            })),

        addAlbumPhotos: (albumLinkId, photos) =>
            set((state) => {
                const currentPhotos = state.albumsPhotos[albumLinkId] || [];
                const newPhotos = photos.filter(
                    (newPhoto) => !currentPhotos.some((existingPhoto) => existingPhoto.linkId === newPhoto.linkId)
                );

                return {
                    albumsPhotos: {
                        ...state.albumsPhotos,
                        [albumLinkId]: [...currentPhotos, ...newPhotos],
                    },
                    albumsPhotosCount: {
                        ...state.albumsPhotosCount,
                        [albumLinkId]: currentPhotos.length + newPhotos.length,
                    },
                };
            }),

        removeAlbumPhotos: (albumLinkId, linkIds) =>
            set((state) => {
                const currentPhotos = state.albumsPhotos[albumLinkId] || [];
                const filteredPhotos = currentPhotos.filter((photo) => !linkIds.includes(photo.linkId));

                return {
                    albumsPhotos: {
                        ...state.albumsPhotos,
                        [albumLinkId]: filteredPhotos,
                    },
                    albumsPhotosCount: {
                        ...state.albumsPhotosCount,
                        [albumLinkId]: filteredPhotos.length,
                    },
                };
            }),

        clearAlbumPhotos: (albumLinkId) =>
            set((state) => {
                const { [albumLinkId]: removedPhotos, ...restAlbums } = state.albumsPhotos;
                return { albumsPhotos: restAlbums };
            }),

        setCurrentAlbumLinkId: (albumLinkId) => set({ currentAlbumLinkId: albumLinkId }),

        updatePhotoTags: (albumLinkId, linkId, tags) =>
            set((state) => {
                const currentPhotos = state.albumsPhotos[albumLinkId] || [];
                const updatedPhotos = currentPhotos.map((photo) =>
                    photo.linkId === linkId ? { ...photo, tags } : photo
                );

                return {
                    albumsPhotos: {
                        ...state.albumsPhotos,
                        [albumLinkId]: updatedPhotos,
                    },
                };
            }),

        updatePhotoFavorite: (albumLinkId, linkId, isFavorite) =>
            set((state) => {
                const currentPhotos = state.albumsPhotos[albumLinkId] || [];
                const photoToUpdate = currentPhotos.find((photo) => photo.linkId === linkId);

                if (!photoToUpdate) {
                    return state;
                }

                let updatedTags = photoToUpdate.tags;

                if (isFavorite) {
                    if (!photoToUpdate.tags.includes(PhotoTag.Favorites)) {
                        updatedTags = [...photoToUpdate.tags, PhotoTag.Favorites]; // Add favorite
                    }
                } else {
                    updatedTags = photoToUpdate.tags.filter((tag) => tag !== PhotoTag.Favorites);
                }

                const updatedPhotos = currentPhotos.map((photo) =>
                    photo.linkId === linkId ? { ...photo, tags: updatedTags } : photo
                );

                return {
                    albumsPhotos: {
                        ...state.albumsPhotos,
                        [albumLinkId]: updatedPhotos,
                    },
                };
            }),
    }))
);
