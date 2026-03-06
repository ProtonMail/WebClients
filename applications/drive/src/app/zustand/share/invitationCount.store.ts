import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type InvitationCountStore = {
    invitationCount: number;
    setInvitationCount: (count: number) => void;
};

export const useInvitationCountStore = create<InvitationCountStore>()(
    devtools(
        (set) => ({
            invitationCount: 0,
            setInvitationCount: (invitationCount) => set({ invitationCount }),
        }),
        { name: 'shared-with-me-invitation-count' }
    )
);
