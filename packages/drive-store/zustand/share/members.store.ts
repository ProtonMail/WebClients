import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { MembersState } from './types';

export const useMembersStore = create<MembersState>()(
    devtools(
        (set) => ({
            members: [],
            setMembers: (members) => set({ members }),
        }),
        { name: 'MembersStore' }
    )
);
