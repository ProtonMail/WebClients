import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { MembersState } from './types';

export const useMembersStore = create<MembersState>()(
    devtools(
        (set, get) => ({
            _shareMembers: new Map(),
            setShareMembers: (shareId, members) =>
                set((state) => ({
                    _shareMembers: new Map(state._shareMembers).set(shareId, members),
                })),
            getShareMembers: (shareId) => {
                const state = get();
                return state._shareMembers.get(shareId) || [];
            },
        }),
        { name: 'MembersStore' }
    )
);
