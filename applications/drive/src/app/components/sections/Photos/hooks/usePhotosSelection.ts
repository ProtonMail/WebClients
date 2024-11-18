import { useCallback, useMemo, useState } from 'react';

import { isPhotoGroup } from '../../../../store/_photos';
import type { PhotoGroup } from '../../../../store/_photos/interface';

type SelectionItem = { linkId: string };
type SelectionGroup = PhotoGroup;

export const getGroupLinkIds = <T extends SelectionItem>(data: (T | SelectionGroup)[], groupIndex: number) => {
    if (!isPhotoGroup(data[groupIndex])) {
        return [];
    }

    const items: string[] = [];

    for (let i = groupIndex + 1; i < data.length; i++) {
        const current = data[i];

        if (isPhotoGroup(current)) {
            break;
        }

        items.push(current.linkId);
    }

    return items;
};

type HandleSelectionArgs = {
    isSelected: boolean;
    isMultiSelect?: boolean;
};

export const usePhotosSelection = <T extends SelectionItem>(
    data: (T | SelectionGroup)[],
    photoLinkIdToIndexMap: Record<string, number>
) => {
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    const [lastIndex, setLastIndex] = useState<number | undefined>();

    const setSelected = useCallback(
        (isSelected: boolean, ...linkIds: string[]) => {
            setSelection((state) => {
                let newState = { ...state };

                linkIds.forEach((linkId) => {
                    if (isSelected) {
                        newState[linkId] = true;
                    } else {
                        delete newState[linkId];
                    }
                });

                return newState;
            });
        },
        [setSelection]
    );

    const clearSelection = useCallback(() => {
        setSelection({});
        setLastIndex(undefined);
    }, [setSelection]);

    const handleSelection = useCallback(
        (index: number, { isSelected, isMultiSelect }: HandleSelectionArgs) => {
            const item = data[index];

            if (isPhotoGroup(item)) {
                const groupLinkIds = getGroupLinkIds(data, index);
                setSelected(isSelected, ...groupLinkIds);
                const lastIndexLinkId = groupLinkIds.shift();
                setLastIndex(lastIndexLinkId ? photoLinkIdToIndexMap[lastIndexLinkId] : undefined);
            } else {
                if (isMultiSelect && lastIndex !== undefined) {
                    const startIndex = lastIndex < index ? lastIndex : index;
                    const endIndex = lastIndex < index ? index : lastIndex;

                    const items = (
                        data.slice(startIndex, endIndex + 1).filter((item) => !isPhotoGroup(item)) as T[]
                    ).map((item) => item.linkId);

                    setSelection({});
                    setSelected(true, ...items);
                    return;
                }

                setLastIndex(index);
                setSelected(isSelected, item.linkId);
            }
        },
        [data, setSelected, photoLinkIdToIndexMap, lastIndex]
    );

    const selectedItems = useMemo(
        () =>
            Object.keys(selection).reduce<T[]>((acc, linkId) => {
                const item = data[photoLinkIdToIndexMap[linkId]];
                if (item && !isPhotoGroup(item)) {
                    acc.push(item);
                }

                return acc;
            }, []),
        [selection, data, photoLinkIdToIndexMap]
    );

    const isGroupSelected = useCallback(
        (groupIndex: number) => {
            let linkIds = getGroupLinkIds(data, groupIndex);
            let selectedCount = 0;

            for (let linkId of linkIds) {
                if (selection[linkId]) {
                    selectedCount++;
                } else if (selectedCount > 0) {
                    break;
                }
            }

            if (selectedCount === 0) {
                return false;
            }

            return selectedCount === linkIds.length || 'some';
        },
        [data, selection]
    );

    const isItemSelected = useCallback((linkId: string) => !!selection[linkId], [selection]);

    return {
        selectedItems,
        setSelected,
        clearSelection,
        handleSelection,
        isGroupSelected,
        isItemSelected,
    };
};
