import { createContext, useContext } from 'react';

import { createUseContext } from '../../hooks/useContextFactory';
import type { AccessKeys } from '../../lib/access/types';
import type { MaybeNull, Result, SelectedItem, SelectedShare } from '../../types';
import type { Invite } from '../../types/data/invites';

export type InviteContextState =
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

export { InviteActionsContext, LatestInviteContext };
export type { InviteActionsContextValue };
