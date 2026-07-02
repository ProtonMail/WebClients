import { create } from 'zustand';

type InvitationCountStore = {
    invitationCount: number;
    setInvitationCount: (count: number) => void;
};

// A global store used to share invitations between multiple page components (sidebar
// and shared with me sections).
export const useInvitationCountStore = create<InvitationCountStore>()((set) => ({
    invitationCount: 0,
    setInvitationCount: (invitationCount) => set({ invitationCount }),
}));
