import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { SelectedItem, SelectedShare } from '@proton/pass/types';
import { type MaybeNull, ShareType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';

import { ItemAccessManager } from './Item/ItemAccessManager';
import { ItemInviteCreate } from './Item/ItemInviteCreate';
import { ItemInviteRespond } from './Item/ItemInviteRespond';
import { VaultAccessManager } from './Vault/VaultAccessManager';
import { VaultInviteCreate, type VaultInviteCreateValues } from './Vault/VaultInviteCreate';
import { VaultInviteRespond } from './Vault/VaultInviteRespond';

type InviteContextState =
    | ({ view: 'invite-vault' } & VaultInviteCreateValues<false>)
    | ({ view: 'invite-vault-new' } & VaultInviteCreateValues<true>)
    | ({ view: 'invite-item' } & SelectedItem)
    | ({ view: 'manage-vault' } & SelectedShare)
    | ({ view: 'manage-item' } & SelectedItem);

type InviteActionsContextValue = {
    close: () => void;
    createVaultInvite: (props: VaultInviteCreateValues<false>) => void;
    createItemInvite: (shareId: string, itemId: string) => void;
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

    const actions = useMemo<InviteActionsContextValue>(
        () => ({
            close: () => setState(null),
            createVaultInvite: (props) => setState({ view: 'invite-vault', ...props }),
            createItemInvite: (shareId, itemId) => setState({ view: 'invite-item', shareId, itemId }),
            createSharedVault: (props) => setState({ view: 'invite-vault-new', ...props }),
            manageVaultAccess: (shareId) => setState({ view: 'manage-vault', shareId }),
            manageItemAccess: (shareId, itemId) => setState({ view: 'manage-item', shareId, itemId }),
            onInviteResponse: () => setInvite(null),
            onShareDisabled: (disabledShareId) => {
                const shareId = (() => {
                    switch (stateRef.current?.view) {
                        case 'invite-vault':
                            return stateRef.current.vault.shareId;
                        case 'invite-item':
                            return stateRef.current.shareId;
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
                        case 'invite-item':
                            return <ItemInviteCreate shareId={state.shareId} itemId={state.itemId} />;
                        case 'invite-vault':
                            return <VaultInviteCreate withVaultCreation={false} vault={state.vault} />;
                        case 'invite-vault-new':
                            return (
                                <VaultInviteCreate
                                    withVaultCreation
                                    item={state.item}
                                    onVaultCreated={(selectedShareId) => setFilters({ selectedShareId })}
                                />
                            );

                        case 'manage-item':
                            return <ItemAccessManager shareId={state.shareId} itemId={state.itemId} />;
                        case 'manage-vault':
                            return <VaultAccessManager shareId={state.shareId} />;
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
