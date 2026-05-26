import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type InvitationCountStore = {
    invitationCount: number;
    setInvitationCount: (count: number) => void;
};

// A global store used to share invitations between multiple page components (sidebar
// and shared with me sections).
export const useInvitationCountStore = create<InvitationCountStore>()(
    devtools(
        (set) => ({
            invitationCount: 0,
            setInvitationCount: (invitationCount) => set({ invitationCount }),
        }),
        { name: 'shared-with-me-invitation-count' }
    )
);
