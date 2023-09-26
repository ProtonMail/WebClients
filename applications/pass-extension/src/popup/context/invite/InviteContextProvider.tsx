import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { VaultInvite } from '../../components/Invite/VaultInvite';
import { VaultInviteManager } from '../../components/Invite/VaultInviteManager';

export type InviteContextValue = {
    shareId: MaybeNull<string>;
    invite: (shareId: string) => void;
    manage: (shareId: string) => void;
    close: () => void;
};

export type InviteView = 'invite' | 'manage';

const InviteContext = createContext<InviteContextValue>({
    shareId: null,
    invite: noop,
    manage: noop,
    close: noop,
});

export const InviteContextProvider: FC = ({ children }) => {
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [view, setView] = useState<MaybeNull<InviteView>>(null);

    const invite = useCallback(async (shareId: string) => {
        setShareId(shareId);
        setView('invite');
    }, []);

    const manage = useCallback((shareId: string) => {
        setShareId(shareId);
        setView('manage');
    }, []);

    const close = useCallback(() => {
        setShareId(null);
        setView(null);
    }, []);

    const contextValue = useMemo<InviteContextValue>(() => ({ shareId, invite, manage, close }), [shareId]);

    return (
        <InviteContext.Provider value={contextValue}>
            {shareId &&
                (() => {
                    switch (view) {
                        case 'invite':
                            return <VaultInvite shareId={shareId} />;
                        case 'manage':
                            return <VaultInviteManager shareId={shareId} />;
                    }
                })()}

            {children}
        </InviteContext.Provider>
    );
};

export const useInviteContext = () => useContext(InviteContext);
