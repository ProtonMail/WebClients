import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ProtonInvitationWithNode } from '@proton/drive/index';

interface AlbumInvitationsStore {
    invitations: Map<string, ProtonInvitationWithNode>;
    isLoading: boolean;

    setInvitations: (invitations: ProtonInvitationWithNode[]) => void;
    removeInvitation: (uid: string) => void;
    setLoading: (loading: boolean) => void;
}

// TODO: We need to see how we can combine it with the shared with me (or not)
export const useAlbumInvitationsStore = create<AlbumInvitationsStore>()(
    devtools((set) => ({
        invitations: new Map(),
        isLoading: false,

        setInvitations: (invitations) => set({ invitations: new Map(invitations.map((i) => [i.uid, i])) }),

        removeInvitation: (uid) =>
            set((state) => {
                const invitations = new Map(state.invitations);
                invitations.delete(uid);
                return { invitations };
            }),

        setLoading: (loading) => set({ isLoading: loading }),
    }))
);
