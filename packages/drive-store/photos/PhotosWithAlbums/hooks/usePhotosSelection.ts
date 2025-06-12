import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { usePhotoSelectionStore } from '../../../zustand/photos/selection.store';
import type { PhotosLayoutOutletContext } from '../layout/PhotosLayout';

type HandleSelectionArgs = {
    isSelected: boolean;
    isMultiSelect: boolean;
};

export const usePhotosSelection = ({
    photos,
    photoLinkIdToIndexMap,
    albumPhotos,
    albumPhotosLinkIdToIndexMap,
}: Pick<
    PhotosLayoutOutletContext,
    'photos' | 'photoLinkIdToIndexMap' | 'albumPhotos' | 'albumPhotosLinkIdToIndexMap'
>) => {
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );

    const map = useMemo(
        () => (currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotosLinkIdToIndexMap : photoLinkIdToIndexMap),
        [currentPageType, albumPhotosLinkIdToIndexMap, photoLinkIdToIndexMap]
    );

    const data = useMemo(
        () => (currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotos : photos),
        [currentPageType, albumPhotos, photos]
    );

    const { setSelected, clearSelection, isGroupSelected, isItemSelected, getSelectedItems } = usePhotoSelectionStore();

    const selectedItems = getSelectedItems(data, map);

    const handleSelection = useCallback(
        (index: number, args: HandleSelectionArgs) => {
            usePhotoSelectionStore.getState().handleSelection(data, map, index, args);
        },
        [data, map]
    );

    const wrappedIsGroupSelected = useCallback(
        (groupIndex: number) => {
            return isGroupSelected(data, groupIndex);
        },
        [data, isGroupSelected]
    );

    return {
        selectedItems,
        setSelected,
        clearSelection,
        handleSelection,
        isGroupSelected: wrappedIsGroupSelected,
        isItemSelected,
    };
};
