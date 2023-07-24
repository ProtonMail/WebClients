import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { VaultInvite } from '../../components/Invite/VaultInvite';
import { VaultInviteManager } from '../../components/Invite/VaultInviteManager';

export type InviteContextValue = {
    shareId: MaybeNull<string>;
    invite: (shareId: string, type: ShareType) => void;
    manage: (shareId: string, type: ShareType) => void;
};

const InviteContext = createContext<InviteContextValue>({
    shareId: null,
    invite: noop,
    manage: noop,
});

export const InviteContextProvider: FC = ({ children }) => {
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [inviting, setInviting] = useState(false);
    const [managing, setManaging] = useState(false);

    const invite = useCallback(async (shareId: string, type: ShareType) => {
        if (type === ShareType.Item) throw new Error('not supported');
        setShareId(shareId);
        setInviting(true);
    }, []);

    const manage = useCallback((shareId: string, type: ShareType) => {
        if (type === ShareType.Item) throw new Error('not supported');
        setShareId(shareId);
        setManaging(true);
    }, []);

    const contextValue = useMemo<InviteContextValue>(() => ({ shareId, invite, manage }), [shareId]);

    return (
        <InviteContext.Provider value={contextValue}>
            {shareId && inviting && (
                <VaultInvite open shareId={shareId} onClose={() => setInviting(false)} onSubmit={() => {}} />
            )}

            {shareId && managing && <VaultInviteManager open shareId={shareId} onClose={() => setManaging(false)} />}

            {children}
        </InviteContext.Provider>
    );
};

export const useInviteContext = () => useContext(InviteContext);
