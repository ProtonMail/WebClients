import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { AlbumsPageTypes, usePhotoLayoutStore } from '../../layout.store';
import { usePhotoSelectionStore } from '../../selection.store';
import type { PhotoItem } from '../../usePhotos.store';
import { usePhotosStore } from '../../usePhotos.store';
import { isPhotoGroup } from '../../utils/isPhotoGroup';
import { sortWithCategories } from '../../utils/sortWithCategories';

type HandleSelectionArgs = {
    isSelected: boolean;
    isMultiSelect: boolean;
};

export const usePhotosSelection = ({
    photoTimelineUids,
    albumPhotoTimelineUids,
    selectedTags,
}: {
    photoTimelineUids: Set<string>;
    albumPhotoTimelineUids: Set<string> | undefined;
    selectedTags?: number[];
}) => {
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );

    const photoItems = usePhotosStore((state) => state.photoItems);

    const { data, map } = useMemo(() => {
        const baseUids = Array.from(
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY
                ? (albumPhotoTimelineUids ?? new Set<string>())
                : photoTimelineUids
        );

        const filteredUids =
            selectedTags && !selectedTags.includes(PhotoTag.All)
                ? baseUids.filter((uid) => {
                      const tags = photoItems.get(uid)?.tags ?? [];
                      return selectedTags.some((tag) => tags.includes(tag));
                  })
                : baseUids;

        const { photoItems: allPhotoItems } = usePhotosStore.getState();
        const items = filteredUids.flatMap((uid) => {
            const item = allPhotoItems.get(uid);
            return item ? [item] : [];
        });

        const grouped = sortWithCategories(items);

        const indexMap: Record<string, number> = {};
        grouped.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                indexMap[(item as PhotoItem).nodeUid] = index;
            }
        });

        return { data: grouped, map: indexMap };
    }, [currentPageType, albumPhotoTimelineUids, photoTimelineUids, selectedTags, photoItems]);

    const { setSelected, clearSelection, isGroupSelected, isItemSelected, getSelectedItems } = usePhotoSelectionStore();

    const selectedItems = getSelectedItems<PhotoItem>(data, map);

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
