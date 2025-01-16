import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { MaybeNull } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';

import { VaultAccessManager } from './VaultAccessManager';
import { VaultInviteCreate, type VaultInviteCreateValues } from './VaultInviteCreate';
import { VaultInviteRespond } from './VaultInviteRespond';

type InviteContextState =
    | ({ view: 'invite' } & VaultInviteCreateValues<false>)
    | ({ view: 'invite-new' } & VaultInviteCreateValues<true>)
    | { view: 'manage'; shareId: string };

type InviteActionsContextValue = {
    close: () => void;
    createInvite: (props: VaultInviteCreateValues<false>) => void;
    createSharedVault: (props: VaultInviteCreateValues<true>) => void;
    manageAccess: (shareId: string) => void;
    onInviteResponse: () => void;
    onShareDisabled: (disabledShareId: string) => void;
    setInvite: (invite: Invite) => void;
};

const LatestInviteContext = createContext<MaybeNull<Invite>>(null);
const InviteActionsContext = createContext<MaybeNull<InviteActionsContextValue>>(null);

export const useLatestInvite = () => useContext(LatestInviteContext);
export const useInviteActions = createUseContext(InviteActionsContext);

export const InviteProvider: FC<PropsWithChildren> = ({ children }) => {
    const { setFilters } = useNavigationFilters();

    const latestInvite = useSelector(selectMostRecentInvite);
    const [invite, setInvite] = useState<MaybeNull<Invite>>(null);
    const [state, setState] = useState<MaybeNull<InviteContextState>>(null);
    const stateRef = useStatefulRef(state);

    const actions = useMemo(
        () => ({
            close: () => setState(null),
            createInvite: (props: VaultInviteCreateValues<false>) => setState({ view: 'invite', ...props }),
            createSharedVault: (props: VaultInviteCreateValues<true>) => setState({ view: 'invite-new', ...props }),
            manageAccess: (shareId: string) => setState({ view: 'manage', shareId }),
            onInviteResponse: () => setInvite(null),
            onShareDisabled: (disabledShareId: string) => {
                const shareId = (() => {
                    switch (stateRef.current?.view) {
                        case 'invite':
                            return stateRef.current.vault.shareId;
                        case 'manage':
                            return stateRef.current.shareId;
                        default:
                            return null;
                    }
                })();

                if (disabledShareId === shareId) {
                    setInvite(null);
                    setState(null);
                }
            },
            setInvite,
        }),
        []
    );

    useEffect(() => {
        /* If the latest invite was promoted from a new user invite,
         * auto prompt the "respond to invite" modal */
        if (latestInvite?.fromNewUser) setInvite(latestInvite);
    }, [latestInvite]);

    return (
        <InviteActionsContext.Provider value={actions}>
            <LatestInviteContext.Provider value={latestInvite}>
                {(() => {
                    switch (state?.view) {
                        case 'invite':
                            return <VaultInviteCreate withVaultCreation={false} {...state} />;
                        case 'invite-new':
                            return (
                                <VaultInviteCreate
                                    withVaultCreation
                                    {...state}
                                    onVaultCreated={(selectedShareId) => setFilters({ selectedShareId })}
                                />
                            );
                        case 'manage':
                            return <VaultAccessManager shareId={state.shareId} />;
                        default:
                            return null;
                    }
                })()}

                {invite && <VaultInviteRespond token={invite.token} />}
                {children}
            </LatestInviteContext.Provider>
        </InviteActionsContext.Provider>
    );
};
