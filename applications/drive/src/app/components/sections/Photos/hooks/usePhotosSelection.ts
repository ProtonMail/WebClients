import { useCallback, useMemo, useState } from 'react';

type SelectionItem = { linkId: string };

export const usePhotosSelection = <T extends SelectionItem>(
    data: (T | string)[],
    photoLinkIdToIndexMap: Record<string, number>
) => {
    const [selection, setSelection] = useState<Record<string, boolean>>({});

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
    }, [setSelection]);

    const getGroupLinkIds = useCallback(
        (groupIndex: number) => {
            if (typeof data[groupIndex] !== 'string') {
                return [];
            }

            const items: string[] = [];

            for (let i = groupIndex + 1; i < data.length; i++) {
                const current = data[i];

                if (typeof current === 'string') {
                    break;
                }

                items.push(current.linkId);
            }

            return items;
        },
        [data]
    );

    const handleSelection = useCallback(
        (index: number, isSelected: boolean) => {
            const item = data[index];

            if (typeof item === 'string') {
                setSelected(isSelected, ...getGroupLinkIds(index));
            } else {
                setSelected(isSelected, item.linkId);
            }
        },
        [setSelected, data, getGroupLinkIds]
    );

    const selectedItems = useMemo(
        () =>
            Object.keys(selection).reduce<T[]>((acc, linkId) => {
                const item = data[photoLinkIdToIndexMap[linkId]];
                if (item && typeof item !== 'string') {
                    acc.push(item);
                }

                return acc;
            }, []),
        [selection, data, photoLinkIdToIndexMap]
    );
    const hasSelection = selectedItems.length > 0;

    const isGroupSelected = useCallback(
        (groupIndex: number) => {
            let linkIds = getGroupLinkIds(groupIndex);
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
        [hasSelection, getGroupLinkIds, selection]
    );

    const isItemSelected = useCallback((linkId: string) => !!selection[linkId], [selection]);

    return {
        selectedItems,
        setSelected,
        clearSelection,
        handleSelection,
        isGroupSelected,
        isItemSelected,
        // Exported for tests
        getGroupLinkIds,
    };
};

export default usePhotosSelection;
