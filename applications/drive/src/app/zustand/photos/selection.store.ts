import { create } from 'zustand';

import type { PhotoGroup } from '../../photos/usePhotos.store';
import { isPhotoGroup } from '../../photos/utils/isPhotoGroup';

export interface HandleSelectionArgs {
    isSelected: boolean;
    isMultiSelect: boolean;
}

type SelectionItem = { nodeUid: string };
type SelectionGroup = PhotoGroup;

const getItemId = (item: SelectionItem): string => item.nodeUid;

export const getGroupNodeUids = <T extends SelectionItem>(data: (T | SelectionGroup)[], groupIndex: number) => {
    if (!isPhotoGroup(data[groupIndex])) {
        return [];
    }

    const items: string[] = [];

    for (let i = groupIndex + 1; i < data.length; i++) {
        const current = data[i];

        if (isPhotoGroup(current)) {
            break;
        }

        items.push(getItemId(current));
    }

    return items;
};

interface PhotoSelectionState {
    selection: Record<string, boolean>;
    lastIndex: number | undefined;

    setSelected: (isSelected: boolean, ...nodeUids: string[]) => void;
    clearSelection: () => void;
    handleSelection: (data: any[], map: Record<string, number>, index: number, args: HandleSelectionArgs) => void;
    isGroupSelected: (data: any[], groupIndex: number) => boolean | 'some';
    isItemSelected: (nodeUid: string) => boolean;

    getSelectedItems: <T extends { nodeUid: string }>(data: any[], map: Record<string, number>) => T[];
}

export const usePhotoSelectionStore = create<PhotoSelectionState>((set, get) => ({
    selection: {},
    lastIndex: undefined,

    setSelected: (isSelected, ...nodeUids) => {
        set((state) => {
            const newSelection = { ...state.selection };
            nodeUids.forEach((nodeUid) => {
                if (isSelected) {
                    newSelection[nodeUid] = true;
                } else {
                    delete newSelection[nodeUid];
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
            const groupNodeUids = getGroupNodeUids(data, index);
            setSelected(isSelected, ...groupNodeUids);
            const lastIndexNodeUid = groupNodeUids.shift();
            set({ lastIndex: lastIndexNodeUid ? map[lastIndexNodeUid] : undefined });
        } else {
            if (isMultiSelect && lastIndex !== undefined) {
                const startIndex = lastIndex < index ? lastIndex : index;
                const endIndex = lastIndex < index ? index : lastIndex;
                const items = data
                    .slice(startIndex, endIndex + 1)
                    .filter((item) => !isPhotoGroup(item))
                    .map((item) => getItemId(item));
                set({ selection: {} });
                setSelected(true, ...items);
                return;
            }
            set({ lastIndex: index });
            setSelected(isSelected, getItemId(item));
        }
    },

    isGroupSelected: (data, groupIndex) => {
        const { selection } = get();
        const nodeUids = getGroupNodeUids(data, groupIndex);
        let selectedCount = 0;

        for (const nodeUid of nodeUids) {
            if (selection[nodeUid]) {
                selectedCount++;
            } else if (selectedCount > 0) {
                break;
            }
        }

        if (selectedCount === 0) {
            return false;
        }
        return selectedCount === nodeUids.length || 'some';
    },

    isItemSelected: (nodeUid) => {
        return !!get().selection[nodeUid];
    },

    getSelectedItems: (data, map) => {
        const { selection } = get();
        const result = [];
        for (const nodeUid of Object.keys(selection)) {
            const item = data[map[nodeUid]];
            if (item && !isPhotoGroup(item)) {
                result.push(item);
            }
        }
        return result;
    },
}));
