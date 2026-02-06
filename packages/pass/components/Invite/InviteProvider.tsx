import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSelectItem } from '@proton/pass/components/Navigation/NavigationActions';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { Result, SelectedItem, SelectedShare } from '@proton/pass/types';
import { type MaybeNull, ShareType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';

import { InviteError } from './InviteError';
import { ItemAccessManager } from './Item/ItemAccessManager';
import { ItemInviteCreate } from './Item/ItemInviteCreate';
import { ItemInviteRespond } from './Item/ItemInviteRespond';
import { VaultAccessManager } from './Vault/VaultAccessManager';
import { VaultInviteCreate } from './Vault/VaultInviteCreate';
import { VaultInviteRespond } from './Vault/VaultInviteRespond';

import './InviteProvider.scss';

type InviteContextState =
    | ({ view: 'invite-vault' } & SelectedShare)
    | ({ view: 'invite-item' } & SelectedItem)
    | ({ view: 'manage-vault' } & SelectedShare)
    | ({ view: 'manage-item' } & SelectedItem);

export type InviteResponseDTO = Result<AccessKeys, {}>;

type InviteActionsContextValue = {
    close: () => void;
    createVaultInvite: (shareId: string) => void;
    createItemInvite: (shareId: string, itemId: string) => void;
    manageVaultAccess: (shareId: string) => void;
    manageItemAccess: (shareId: string, itemId: string) => void;
    onInviteResponse: (response: InviteResponseDTO) => void;
    setInvite: (invite: MaybeNull<Invite>) => void;
};

const LatestInviteContext = createContext<MaybeNull<Invite>>(null);
const InviteActionsContext = createContext<MaybeNull<InviteActionsContextValue>>(null);

export const useLatestInvite = () => useContext(LatestInviteContext);
export const useInviteActions = createUseContext(InviteActionsContext);

export const InviteProvider: FC<PropsWithChildren> = ({ children }) => {
    const latestInvite = useSelector(selectMostRecentInvite);

    const [invite, setInvite] = useState<MaybeNull<Invite>>(null);
    const [state, setState] = useState<MaybeNull<InviteContextState>>(null);

    const selectItem = useSelectItem();
    const vaultActions = useVaultActions();

    const actions = useMemo<InviteActionsContextValue>(
        () => ({
            close: () => setState(null),
            createVaultInvite: (shareId) => setState({ view: 'invite-vault', shareId }),
            createItemInvite: (shareId, itemId) => setState({ view: 'invite-item', shareId, itemId }),
            manageVaultAccess: (shareId) => setState({ view: 'manage-vault', shareId }),
            manageItemAccess: (shareId, itemId) => setState({ view: 'manage-item', shareId, itemId }),
            onInviteResponse: (res) => {
                if (res.ok && res.itemId) selectItem(res.shareId, res.itemId);
                if (res.ok && !res.itemId) vaultActions.select(res.shareId);
                setInvite(null);
            },
            setInvite,
        }),
        []
    );

    const onError = useCallback(() => {
        setInvite(null);
        setState(null);
    }, []);

    useEffect(() => {
        /* If the latest invite was promoted from a new user invite,
         * auto prompt the "respond to invite" modal */
        if (latestInvite?.fromNewUser) setInvite(latestInvite);
    }, [latestInvite]);

    return (
        <InviteActionsContext.Provider value={actions}>
            <LatestInviteContext.Provider value={latestInvite}>
                <InviteError onError={onError}>
                    {(() => {
                        switch (state?.view) {
                            case 'invite-item':
                                return <ItemInviteCreate shareId={state.shareId} itemId={state.itemId} />;
                            case 'invite-vault':
                                return <VaultInviteCreate shareId={state.shareId} />;
                            case 'manage-item':
                                return <ItemAccessManager shareId={state.shareId} itemId={state.itemId} />;
                            case 'manage-vault':
                                return <VaultAccessManager shareId={state.shareId} />;
                            default:
                                return null;
                        }
                    })()}

                    {invite?.targetType === ShareType.Vault && <VaultInviteRespond token={invite.token} />}
                    {invite?.targetType === ShareType.Item && <ItemInviteRespond token={invite.token} />}
                </InviteError>
                {children}
            </LatestInviteContext.Provider>
        </InviteActionsContext.Provider>
    );
};
