import { createContext, useContext } from 'react';

import type { MaybeNull } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import noop from '@proton/utils/noop';

import { type VaultInviteCreateValues } from './VaultInviteCreate';

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

export const InviteContext = createContext<InviteContextValue>({
    latestInvite: null,
    close: noop,
    createInvite: noop,
    createSharedVault: noop,
    manageAccess: noop,
    onInviteResponse: noop,
    onShareDisabled: noop,
    respondToInvite: noop,
});

export const useInviteContext = () => useContext(InviteContext);
