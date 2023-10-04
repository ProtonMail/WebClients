import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import noop from '@proton/utils/noop';

import { useShareEventEffect } from '../../../shared/hooks';
import { VaultAccessManager } from '../../components/Invite/VaultAccessManager';
import { VaultInviteCreate } from '../../components/Invite/VaultInviteCreate';
import { VaultInviteRespond } from '../../components/Invite/VaultInviteRespond';

export type InviteContextValue = {
    shareId: MaybeNull<string>;
    close: () => void;
    createInvite: (shareId: string) => void;
    manageAccess: (shareId: string) => void;
    onInviteResponse: () => void;
    respondToInvite: (invite: Invite) => void;
};

export type InviteView = 'invite' | 'manage';

const InviteContext = createContext<InviteContextValue>({
    shareId: null,
    close: noop,
    createInvite: noop,
    manageAccess: noop,
    onInviteResponse: noop,
    respondToInvite: noop,
});

export const InviteContextProvider: FC = ({ children }) => {
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [view, setView] = useState<MaybeNull<InviteView>>(null);
    const [invite, setInvite] = useState<MaybeNull<Invite>>(null);

    useShareEventEffect(
        useMemo(
            () => ({
                listen: shareId !== null,
                onShareDisabled: (disabledShareId) => {
                    if (disabledShareId === shareId) {
                        setShareId(null);
                        setInvite(null);
                        setView(null);
                    }
                },
            }),
            [shareId]
        )
    );

    const createInvite = useCallback(async (shareId: string) => {
        setShareId(shareId);
        setView('invite');
    }, []);

    const respondToInvite = useCallback(async (invite: Invite) => setInvite(invite), []);
    const onInviteResponse = useCallback(() => setInvite(null), []);

    const manageAccess = useCallback((shareId: string) => {
        setShareId(shareId);
        setView('manage');
    }, []);

    const close = useCallback(() => {
        setShareId(null);
        setView(null);
    }, []);

    const contextValue = useMemo<InviteContextValue>(
        () => ({
            shareId,
            close,
            createInvite,
            manageAccess,
            onInviteResponse,
            respondToInvite,
        }),
        [shareId]
    );

    return (
        <InviteContext.Provider value={contextValue}>
            {shareId &&
                (() => {
                    switch (view) {
                        case 'invite':
                            return <VaultInviteCreate shareId={shareId} />;
                        case 'manage':
                            return <VaultAccessManager shareId={shareId} />;
                    }
                })()}

            {invite && <VaultInviteRespond {...invite} />}
            {children}
        </InviteContext.Provider>
    );
};

export const useInviteContext = () => useContext(InviteContext);
