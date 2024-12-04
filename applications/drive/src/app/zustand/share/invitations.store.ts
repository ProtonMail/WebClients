import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { InvitationsState } from './types';

export const useInvitationsStore = create<InvitationsState>()(
    devtools(
        (set) => ({
            invitations: [],
            externalInvitations: [],

            setInvitations: (invitations) => set({ invitations }, false, 'invitations/set'),

            removeInvitations: (invitations) => set({ invitations }, false, 'invitations/remove'),

            updateInvitationsPermissions: (invitations) => set({ invitations }, false, 'invitations/updatePermissions'),

            setExternalInvitations: (externalInvitations) =>
                set({ externalInvitations }, false, 'externalInvitations/set'),

            removeExternalInvitations: (externalInvitations) =>
                set({ externalInvitations }, false, 'externalInvitations/remove'),

            updateExternalInvitations: (externalInvitations) =>
                set({ externalInvitations }, false, 'externalInvitations/updatePermissions'),

            addMultipleInvitations: (invitations, externalInvitations) =>
                set({ invitations, externalInvitations }, false, 'invitations/addMultiple'),
        }),
        { name: 'InvitationsStore' }
    )
);
