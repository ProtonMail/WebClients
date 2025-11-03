import { create } from 'zustand';

import type { DirectoryTreeState } from './types';

export const directoryTreeStoreFactory = () => {
    return create<DirectoryTreeState>()((set, get) => ({
        items: new Map(),

        addItem: (newItem) =>
            set((state) => ({
                items: new Map(state.items).set(newItem.uid, newItem),
            })),

        getChildrenOf: (uid) =>
            Array.from(
                get()
                    .items.values()
                    .filter((item) => item.parentUid === uid)
            ),

        setExpanded: (uid, expanded) =>
            set((state) => {
                const maybeItem = state.items.get(uid);
                if (!maybeItem) {
                    return state;
                }

                return {
                    items: new Map(state.items).set(uid, { ...maybeItem, expanded: expanded }),
                };
            }),
    }));
};
