import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { SelectionStore } from './types';
import { calculateSelectionState, filterValidSelections, getRangeOfItems } from './utils';

export const useSelectionStore = create<SelectionStore>()(
    devtools(
        (set, get) => ({
            selectedItemIds: new Set(),
            multiSelectStartId: undefined,
            allItemIds: [],

            setAllItemIds: (itemIds: string[]) => {
                set((state) => {
                    const validSelections = filterValidSelections(state.selectedItemIds, itemIds);
                    const needsUpdate = validSelections.size !== state.selectedItemIds.size;

                    if (needsUpdate) {
                        return {
                            allItemIds: itemIds,
                            selectedItemIds: validSelections,
                            multiSelectStartId:
                                state.multiSelectStartId && !validSelections.has(state.multiSelectStartId)
                                    ? undefined
                                    : state.multiSelectStartId,
                        };
                    }

                    return { allItemIds: itemIds };
                });
            },

            toggleSelectItem: (id: string) => {
                set((state) => {
                    const newSelectedIds = new Set(state.selectedItemIds);
                    const wasSelected = newSelectedIds.has(id);

                    if (wasSelected) {
                        newSelectedIds.delete(id);
                    } else {
                        newSelectedIds.add(id);
                    }

                    const shouldUpdateMultiSelectStart = !wasSelected || newSelectedIds.size > 0;

                    return {
                        selectedItemIds: newSelectedIds,
                        multiSelectStartId: shouldUpdateMultiSelectStart ? id : undefined,
                    };
                });
            },

            toggleAllSelected: () => {
                set((state) => {
                    const allSelected = state.selectedItemIds.size === state.allItemIds.length;

                    return {
                        selectedItemIds: allSelected ? new Set() : new Set(state.allItemIds),
                        multiSelectStartId: undefined,
                    };
                });
            },

            toggleRange: (endId: string) => {
                set((state) => {
                    if (!state.multiSelectStartId) {
                        return {
                            selectedItemIds: new Set([endId]),
                            multiSelectStartId: endId,
                        };
                    }

                    const rangeItems = getRangeOfItems(state.allItemIds, state.multiSelectStartId, endId);

                    return {
                        selectedItemIds: new Set(rangeItems),
                    };
                });
            },

            selectItem: (id: string) => {
                set((state) => {
                    if (state.selectedItemIds.size === 1 && state.selectedItemIds.has(id)) {
                        return state;
                    }

                    return {
                        selectedItemIds: new Set([id]),
                        multiSelectStartId: id,
                    };
                });
            },

            clearSelections: () => {
                set({
                    selectedItemIds: new Set(),
                    multiSelectStartId: undefined,
                });
            },

            isSelected: (id: string) => {
                return get().selectedItemIds.has(id);
            },

            getSelectionState: () => {
                const state = get();
                return calculateSelectionState(state.selectedItemIds.size, state.allItemIds.length);
            },

            getSelectedItemIds: () => {
                return Array.from(get().selectedItemIds);
            },
        }),
        {
            name: 'drive-selection',
        }
    )
);
