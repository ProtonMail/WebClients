import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellRef } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getMailboxes } from '@proton/pass/store/actions';
import { selectCanManageAlias } from '@proton/pass/store/selectors';
import type { MaybeNull, UserMailboxOutput } from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectMap } from '@proton/pass/utils/object/map';
import { fullMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { toMap } from '@proton/shared/lib/helpers/object';

import { AliasMailboxCreateModal } from './AliasMailboxCreateModal';
import { AliasMailboxDeleteModal } from './AliasMailboxDeleteModal';
import { MailboxVerifyModal } from './AliasMailboxVerifyModal';

export interface AliasMailboxesContextValue {
    action: MaybeNull<AliasMailboxAction>;
    loading: boolean;
    canManage: boolean;
    mailboxes: UserMailboxOutput[];
    setAction: (action: AliasMailboxAction) => void;
    onCreate: (contact: UserMailboxOutput) => void;
    onVerify: (mailbox: UserMailboxOutput) => void;
    onDelete: (mailboxID: number) => void;
    onSetDefault: (mailboxID: number) => void;
}

export type AliasMailboxAction =
    | { type: 'add' }
    | { type: 'verify'; mailboxID: number; sentAt: number }
    | { type: 'delete'; mailboxID: number };

export const AliasMailboxesContext = createContext<MaybeNull<AliasMailboxesContextValue>>(null);
export const useAliasMailboxes = createUseContext(AliasMailboxesContext);

export const AliasMailboxesProvider: FC<{ children: (ctx: AliasMailboxesContextValue) => ReactNode }> = ({
    children,
}) => {
    const spotlight = useSpotlight();
    const canManage = useSelector(selectCanManageAlias);
    const [action, setAction] = useState<MaybeNull<AliasMailboxAction>>(null);
    const resetAction = () => setAction(null);

    const [mailboxes, setMailboxes] = useState<Record<number, UserMailboxOutput>>({});
    const sync = useRequest(getMailboxes, { onSuccess: (mailboxes) => setMailboxes(toMap(mailboxes, 'MailboxID')) });

    const context = useMemo<AliasMailboxesContextValue>(
        () => ({
            action,
            canManage,
            loading: sync.loading,
            mailboxes: Object.values(mailboxes),
            setAction: (action) => {
                switch (action.type) {
                    case 'add':
                        if (!canManage) spotlight.setUpselling({ type: 'pass-plus', upsellRef: UpsellRef.SETTING });
                        else setAction({ type: 'add' });
                    default:
                        setAction(action);
                }
            },
            onCreate: (mailbox) => {
                setMailboxes((mailboxes) => fullMerge(mailboxes, { [mailbox.MailboxID]: mailbox }));
                setAction({ type: 'verify', mailboxID: mailbox.MailboxID, sentAt: getEpoch() });
            },
            onVerify: (mailbox) => setMailboxes(fullMerge(mailboxes, { [mailbox.MailboxID]: mailbox })),
            onDelete: (mailboxID) => setMailboxes((mailboxes) => objectDelete(mailboxes, mailboxID)),
            onSetDefault: (mailboxID) =>
                setMailboxes((mailboxes) =>
                    objectMap(mailboxes, (_, mailbox) => ({
                        ...mailbox,
                        IsDefault: !(mailbox.IsDefault || mailbox.MailboxID !== mailboxID),
                    }))
                ),
        }),
        [action, canManage, mailboxes, sync.loading]
    );

    useEffect(sync.dispatch, []);

    return (
        <AliasMailboxesContext.Provider value={context}>
            {children(context)}
            {(() => {
                switch (action?.type) {
                    case 'add':
                        return <AliasMailboxCreateModal onClose={resetAction} />;
                    case 'delete':
                        return <AliasMailboxDeleteModal onClose={resetAction} mailboxID={action.mailboxID} />;
                    case 'verify':
                        return (
                            <MailboxVerifyModal
                                onClose={resetAction}
                                mailboxID={action.mailboxID}
                                sentAt={action.sentAt}
                            />
                        );
                }
            })()}
        </AliasMailboxesContext.Provider>
    );
};
