import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import { type MaybeNull, ShareType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';

import { ItemAccessManager } from './ItemAccessManager';
import { ItemInviteCreate, type ItemInviteCreateProps } from './ItemInviteCreate';
import { ItemInviteRespond } from './ItemInviteRespond';
import { VaultAccessManager } from './VaultAccessManager';
import { VaultInviteCreate, type VaultInviteCreateValues } from './VaultInviteCreate';
import { VaultInviteRespond } from './VaultInviteRespond';

type InviteContextState =
    | ({ view: 'invite-vault' } & VaultInviteCreateValues<false>)
    | ({ view: 'invite-new' } & VaultInviteCreateValues<true>)
    | ({ view: 'invite-item' } & ItemInviteCreateProps)
    | { view: 'manage-vault'; shareId: string }
    | { view: 'manage-item'; shareId: string; itemId: string };

type InviteActionsContextValue = {
    close: () => void;
    createVaultInvite: (props: VaultInviteCreateValues<false>) => void;
    createItemInvite: (props: ItemInviteCreateProps) => void;
    createSharedVault: (props: VaultInviteCreateValues<true>) => void;
    manageVaultAccess: (shareId: string) => void;
    manageItemAccess: (shareId: string, itemId: string) => void;
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
            createVaultInvite: (props: VaultInviteCreateValues<false>) => setState({ view: 'invite-vault', ...props }),
            createItemInvite: (props: ItemInviteCreateProps) => setState({ view: 'invite-item', ...props }),
            createSharedVault: (props: VaultInviteCreateValues<true>) => setState({ view: 'invite-new', ...props }),
            manageVaultAccess: (shareId: string) => setState({ view: 'manage-vault', shareId }),
            manageItemAccess: (shareId: string, itemId: string) => setState({ view: 'manage-item', shareId, itemId }),
            onInviteResponse: () => setInvite(null),
            onShareDisabled: (disabledShareId: string) => {
                const shareId = (() => {
                    switch (stateRef.current?.view) {
                        case 'invite-vault':
                            return stateRef.current.vault.shareId;
                        case 'invite-item':
                            return stateRef.current.item.shareId;
                        case 'manage-vault':
                            return stateRef.current.shareId;
                        case 'manage-item':
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
                        case 'invite-vault':
                            return <VaultInviteCreate withVaultCreation={false} {...state} />;
                        case 'invite-item':
                            return <ItemInviteCreate {...state} />;
                        case 'invite-new':
                            return (
                                <VaultInviteCreate
                                    withVaultCreation
                                    {...state}
                                    onVaultCreated={(selectedShareId) => setFilters({ selectedShareId })}
                                />
                            );
                        case 'manage-vault':
                            return <VaultAccessManager shareId={state.shareId} />;
                        case 'manage-item':
                            return <ItemAccessManager shareId={state.shareId} itemId={state.itemId} />;
                        default:
                            return null;
                    }
                })()}

                {invite?.targetType === ShareType.Vault && <VaultInviteRespond token={invite.token} />}
                {invite?.targetType === ShareType.Item && <ItemInviteRespond {...invite} />}
                {children}
            </LatestInviteContext.Provider>
        </InviteActionsContext.Provider>
    );
};
