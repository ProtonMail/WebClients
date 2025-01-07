import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { InvitationsState } from './types';

export const useInvitationsStore = create<InvitationsState>()(
    devtools(
        (set, get) => ({
            _sharesInvitations: new Map(),
            _sharesExternalInvitations: new Map(),

            setShareInvitations: (shareId, invitations) =>
                set(
                    (state) => ({
                        _sharesInvitations: new Map(state._sharesInvitations).set(shareId, invitations),
                    }),
                    false,
                    'invitations/set'
                ),

            getShareInvitations: (shareId) => {
                const state = get();
                return state._sharesInvitations.get(shareId) || [];
            },

            removeShareInvitations: (shareId, invitations) =>
                set(
                    (state) => ({
                        _sharesInvitations: new Map(state._sharesInvitations).set(shareId, invitations),
                    }),
                    false,
                    'invitations/remove'
                ),

            updateShareInvitationsPermissions: (shareId, invitations) =>
                set(
                    (state) => ({
                        _sharesInvitations: new Map(state._sharesInvitations).set(shareId, invitations),
                    }),
                    false,
                    'invitations/updatePermissions'
                ),

            setShareExternalInvitations: (shareId, externalInvitations) =>
                set(
                    (state) => ({
                        _sharesExternalInvitations: new Map(state._sharesExternalInvitations).set(
                            shareId,
                            externalInvitations
                        ),
                    }),
                    false,
                    'externalInvitations/set'
                ),

            getShareExternalInvitations: (shareId: string) => {
                const state = get();
                return state._sharesExternalInvitations.get(shareId) || [];
            },

            removeShareExternalInvitations: (shareId, externalInvitations) =>
                set(
                    (state) => ({
                        _sharesExternalInvitations: new Map(state._sharesExternalInvitations).set(
                            shareId,
                            externalInvitations
                        ),
                    }),
                    false,
                    'externalInvitations/remove'
                ),

            updateShareExternalInvitations: (shareId: string, externalInvitations) =>
                set(
                    (state) => ({
                        _sharesExternalInvitations: new Map(state._sharesExternalInvitations).set(
                            shareId,
                            externalInvitations
                        ),
                    }),
                    false,
                    'externalInvitations/updatePermissions'
                ),

            addMultipleShareInvitations: (shareId, invitations, externalInvitations) =>
                set(
                    (state) => ({
                        _sharesInvitations: new Map(state._sharesInvitations).set(shareId, invitations),
                        _sharesExternalInvitations: new Map(state._sharesExternalInvitations).set(
                            shareId,
                            externalInvitations
                        ),
                    }),
                    false,
                    'invitations/addMultiple'
                ),
        }),
        { name: 'InvitationsStore' }
    )
);
