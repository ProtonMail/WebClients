import { create } from 'zustand';

import { type PhotoGroup, type PhotoLink, isPhotoGroup } from '../../store';

export interface HandleSelectionArgs {
    isSelected: boolean;
    isMultiSelect: boolean;
}

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

interface PhotoSelectionState {
    selection: Record<string, boolean>;
    lastIndex: number | undefined;

    setSelected: (isSelected: boolean, ...linkIds: string[]) => void;
    clearSelection: () => void;
    handleSelection: (data: any[], map: Record<string, number>, index: number, args: HandleSelectionArgs) => void;
    isGroupSelected: (data: any[], groupIndex: number) => boolean | 'some';
    isItemSelected: (linkId: string) => boolean;

    getSelectedItems: (data: any[], map: Record<string, number>) => PhotoLink[];
}

export const usePhotoSelectionStore = create<PhotoSelectionState>((set, get) => ({
    selection: {},
    lastIndex: undefined,

    setSelected: (isSelected, ...linkIds) => {
        set((state) => {
            const newSelection = { ...state.selection };
            linkIds.forEach((linkId) => {
                if (isSelected) {
                    newSelection[linkId] = true;
                } else {
                    delete newSelection[linkId];
                }
            });
            return { selection: newSelection };
        });
    },

    clearSelection: () => {
        set({ selection: {}, lastIndex: undefined });
    },

    handleSelection: (data, map, index, { isSelected, isMultiSelect }) => {
        const { setSelected, lastIndex } = get();

        const item = data[index];
        if (isPhotoGroup(item)) {
            const groupLinkIds = getGroupLinkIds(data, index);
            setSelected(isSelected, ...groupLinkIds);
            const lastIndexLinkId = groupLinkIds.shift();
            set({ lastIndex: lastIndexLinkId ? map[lastIndexLinkId] : undefined });
        } else {
            if (isMultiSelect && lastIndex !== undefined) {
                const startIndex = lastIndex < index ? lastIndex : index;
                const endIndex = lastIndex < index ? index : lastIndex;
                const items = (data.slice(startIndex, endIndex + 1).filter((item) => !isPhotoGroup(item)) as any[]).map(
                    (item) => item.linkId
                );
                set({ selection: {} });
                setSelected(true, ...items);
                return;
            }
            set({ lastIndex: index });
            setSelected(isSelected, item.linkId);
        }
    },

    isGroupSelected: (data, groupIndex) => {
        const { selection } = get();
        const linkIds = getGroupLinkIds(data, groupIndex);
        let selectedCount = 0;

        for (const linkId of linkIds) {
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

    isItemSelected: (linkId) => {
        return !!get().selection[linkId];
    },

    getSelectedItems: (data, map) => {
        const { selection } = get();
        return Object.keys(selection).reduce<PhotoLink[]>((acc, linkId) => {
            const item = data[map[linkId]];
            if (item && !isPhotoGroup(item)) {
                acc.push(item);
            }
            return acc;
        }, []);
    },
}));
