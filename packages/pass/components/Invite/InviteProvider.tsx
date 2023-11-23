import type { FC } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { MaybeNull } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import noop from '@proton/utils/noop';

import { VaultAccessManager } from './VaultAccessManager';
import { VaultInviteCreate, type VaultInviteCreateValues } from './VaultInviteCreate';
import { VaultInviteRespond } from './VaultInviteRespond';

export type InviteContextValue = {
    latestInvite: MaybeNull<Invite>;
    close: () => void;
    createInvite: (props: VaultInviteCreateValues<false>) => void;
    createSharedVault: (props: VaultInviteCreateValues<true>) => void;
    manageAccess: (shareId: string) => void;
    onInviteResponse: () => void;
    onShareDisabled: (disabledShareId: string) => void;
    respondToInvite: (invite: Invite) => void;
};

const InviteContext = createContext<InviteContextValue>({
    latestInvite: null,
    close: noop,
    createInvite: noop,
    createSharedVault: noop,
    manageAccess: noop,
    onInviteResponse: noop,
    onShareDisabled: noop,
    respondToInvite: noop,
});

type InviteContextState =
    | ({ view: 'invite' } & VaultInviteCreateValues<false>)
    | ({ view: 'invite-new' } & VaultInviteCreateValues<true>)
    | { view: 'manage'; shareId: string };

type InviteContextProps = { onVaultCreated?: (shareId: string) => void };

export const InviteProvider: FC<InviteContextProps> = ({ children, onVaultCreated }) => {
    const [state, setState] = useState<MaybeNull<InviteContextState>>(null);
    const [invite, setInvite] = useState<MaybeNull<Invite>>(null);
    const latestInvite = useSelector(selectMostRecentInvite);

    const handles = useMemo(
        () => ({
            close: () => setState(null),
            createInvite: (props: VaultInviteCreateValues<false>) => setState({ view: 'invite', ...props }),
            createSharedVault: (props: VaultInviteCreateValues<true>) => setState({ view: 'invite-new', ...props }),
            manageAccess: (shareId: string) => setState({ view: 'manage', shareId }),
            onInviteResponse: () => setInvite(null),
        }),
        []
    );

    const contextValue = useMemo<InviteContextValue>(
        () => ({
            ...handles,
            latestInvite,
            onShareDisabled: (disabledShareId: string) => {
                const shareId = (() => {
                    switch (state?.view) {
                        case 'invite':
                            return state.vault.shareId;
                        case 'manage':
                            return state.shareId;
                        default:
                            return null;
                    }
                })();

                if (disabledShareId === shareId) {
                    setInvite(null);
                    setState(null);
                }
            },
            respondToInvite: setInvite,
        }),
        [state, latestInvite]
    );

    useEffect(() => {
        /* If the latest invite was promoted from a new user invite,
         * auto prompt the "respond to invite" modal */
        if (latestInvite?.fromNewUser) setInvite(latestInvite);
    }, [latestInvite]);

    return (
        <InviteContext.Provider value={contextValue}>
            {(() => {
                switch (state?.view) {
                    case 'invite':
                        return <VaultInviteCreate withVaultCreation={false} {...state} />;
                    case 'invite-new':
                        return <VaultInviteCreate withVaultCreation {...state} onVaultCreated={onVaultCreated} />;
                    case 'manage':
                        return <VaultAccessManager shareId={state.shareId} />;
                    default:
                        return null;
                }
            })()}

            {invite && <VaultInviteRespond {...invite} />}
            {children}
        </InviteContext.Provider>
    );
};

export const useInviteContext = () => useContext(InviteContext);
