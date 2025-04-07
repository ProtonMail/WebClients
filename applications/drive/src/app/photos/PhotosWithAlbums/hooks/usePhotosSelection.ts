import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { usePhotoSelectionStore } from '../../../zustand/photos/selection.store';
import { usePhotosWithAlbumsView } from '../../PhotosStore/usePhotosWithAlbumView';

type HandleSelectionArgs = {
    isSelected: boolean;
    isMultiSelect: boolean;
};

export const usePhotosSelection = () => {
    const { photos, photoLinkIdToIndexMap, albumPhotos, albumPhotosLinkIdToIndexMap } = usePhotosWithAlbumsView();

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
