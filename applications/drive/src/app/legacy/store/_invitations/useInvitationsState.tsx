import { createContext, useCallback, useContext, useState } from 'react';

import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import type { ExtendedInvitationDetails } from './interface';

type InvitationsState = {
    [invitationId: string]: ExtendedInvitationDetails;
};

/**
 * useShareStateProvider provides a storage to cache shares.
 */
export function useInvitationsStateProvider() {
    const [state, setState] = useState<InvitationsState>({});

    const setInvitations = useCallback((invitations: ExtendedInvitationDetails[]) => {
        setState((state) => {
            invitations.forEach((invitation) => {
                state[invitation.invitation.invitationId] = invitation;
            });
            return { ...state };
        });
    }, []);

    const removeInvitations = useCallback((invitationIds: string[]) => {
        setState((state) => {
            return Object.fromEntries(
                Object.entries(state).filter(([invitationId]) => !invitationIds.includes(invitationId))
            );
        });
    }, []);

    const getInvitation = useCallback(
        (invitationId: string): ExtendedInvitationDetails | undefined => {
            return state[invitationId];
        },
        [state]
    );

    const getAllInvitations = useCallback((): ExtendedInvitationDetails[] => {
        return Object.values(state);
    }, [state]);

    const getAlbumsInvitations = useCallback((): ExtendedInvitationDetails[] => {
        return Object.values(state).filter((invitation) => invitation.link.type === LinkType.ALBUM);
    }, [state]);

    return {
        setInvitations,
        removeInvitations,
        getInvitation,
        getAlbumsInvitations,
        getAllInvitations,
    };
}

const InvitationsStateContext = createContext<ReturnType<typeof useInvitationsStateProvider> | null>(null);

export function InvitationsStateProvider({ children }: { children: React.ReactNode }) {
    const value = useInvitationsStateProvider();
    return <InvitationsStateContext.Provider value={value}>{children}</InvitationsStateContext.Provider>;
}

export function useInvitationsState() {
    const state = useContext(InvitationsStateContext);
    if (!state) {
        throw new Error('Trying to use uninitialized InvitationsStateProvider');
    }
    return state;
}
