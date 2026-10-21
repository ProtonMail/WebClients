import { createContext, useMemo } from 'react';

import { createUseContext } from '../../../../hooks/useContextFactory';
import type { UserMailboxOutput } from '../../../../types/api/pass';
import type { MailboxDeleteDTO } from '../../../../types/data/alias';
import type { MaybeNull } from '../../../../types/utils';

export interface AliasMailboxesContextValue {
    action: MaybeNull<AliasMailboxAction>;
    loading: boolean;
    canManage: boolean;
    mailboxes: UserMailboxOutput[];
    setAction: (action: MaybeNull<AliasMailboxAction>) => void;

    getAliasMailboxes: () => void;
    onMailboxCreated: (dto: UserMailboxOutput) => void;
    onMailboxRemoved: (dto: MailboxDeleteDTO) => void;
}

export type AliasMailboxAction =
    | { type: 'create' }
    | { type: 'verify'; mailboxID: number; sentAt?: number }
    | { type: 'delete'; mailboxID: number }
    | { type: 'edit'; mailboxID: number }
    | { type: 'cancel-edit'; mailboxID: number };

export const AliasMailboxesContext = createContext<MaybeNull<AliasMailboxesContextValue>>(null);
export const useAliasMailboxes = createUseContext(AliasMailboxesContext);

export const useMailbox = (mailboxID: number) => {
    const { mailboxes } = useAliasMailboxes();
    return useMemo(() => mailboxes.find((mailbox) => mailbox.MailboxID === mailboxID), [mailboxID, mailboxes]);
};
