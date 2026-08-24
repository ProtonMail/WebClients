import type { FC, PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectMostRecentInvite } from '../../store/selectors/invites';
import type { MaybeNull } from '../../types';
import type { Invite } from '../../types/data/invites';
import { useSelectItem } from '../Navigation/NavigationActions';
import { useVaultActions } from '../Vault/VaultActionsProvider';
import {
    InviteActionsContext,
    type InviteActionsContextValue,
    type InviteContextState,
    LatestInviteContext,
} from './InviteContext';
import { InviteViews } from './InviteViews';

import './InviteProvider.scss';

export type { InviteContextState, InviteResponseDTO } from './InviteContext';
export { useInviteActions, useLatestInvite } from './InviteContext';

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
                <InviteViews inviteState={state} invite={invite} onError={onError} />
                {children}
            </LatestInviteContext.Provider>
        </InviteActionsContext.Provider>
    );
};
