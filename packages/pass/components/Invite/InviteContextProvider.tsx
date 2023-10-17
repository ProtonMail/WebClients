import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import noop from '@proton/utils/noop';

import { VaultAccessManager } from './VaultAccessManager';
import { VaultInviteCreate } from './VaultInviteCreate';
import { VaultInviteRespond } from './VaultInviteRespond';

export type InviteContextValue = {
    shareId: MaybeNull<string>;
    close: () => void;
    createInvite: (shareId: string) => void;
    createInviteWithVaultCreation: (shareId: string) => void;
    manageAccess: (shareId: string) => void;
    onInviteResponse: () => void;
    onShareDisabled: (disabledShareId: string) => void;
    respondToInvite: (invite: Invite) => void;
};

export type InviteView = 'invite-existing' | 'invite-new' | 'manage';

const InviteContext = createContext<InviteContextValue>({
    shareId: null,
    close: noop,
    createInvite: noop,
    createInviteWithVaultCreation: noop,
    manageAccess: noop,
    onInviteResponse: noop,
    onShareDisabled: noop,
    respondToInvite: noop,
});

export const InviteContextProvider: FC = ({ children }) => {
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [view, setView] = useState<MaybeNull<InviteView>>(null);
    const [invite, setInvite] = useState<MaybeNull<Invite>>(null);

    const createInvite = useCallback(async (shareId: string) => {
        setShareId(shareId);
        setView('invite-existing');
    }, []);

    const createInviteWithVaultCreation = useCallback(async (shareId: string) => {
        setShareId(shareId);
        setView('invite-new');
    }, []);

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
            createInviteWithVaultCreation,
            manageAccess,
            onInviteResponse,
            onShareDisabled: (disabledShareId: string) => {
                if (disabledShareId === shareId) {
                    setShareId(null);
                    setInvite(null);
                    setView(null);
                }
            },
            respondToInvite: setInvite,
        }),
        [shareId]
    );

    return (
        <InviteContext.Provider value={contextValue}>
            {shareId &&
                (() => {
                    switch (view) {
                        case 'invite-existing':
                            return <VaultInviteCreate shareId={shareId} />;
                        case 'invite-new':
                            return <VaultInviteCreate shareId={shareId} withVaultCreation />;
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
