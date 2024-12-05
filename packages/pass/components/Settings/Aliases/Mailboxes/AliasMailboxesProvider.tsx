import type { FC, PropsWithChildren } from 'react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellRef } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getMailboxes } from '@proton/pass/store/actions';
import { selectCanManageAlias } from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull, UserMailboxOutput } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
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
    setAction: (action: MaybeNull<AliasMailboxAction>) => void;
    onCreate: (contact: UserMailboxOutput) => void;
    onVerify: (mailbox: UserMailboxOutput) => void;
    onDelete: (mailboxID: number, transferAliases?: boolean) => void;
    onSetDefault: (mailboxID: number) => void;
    getMailboxes: () => void;
}

export type AliasMailboxAction =
    | { type: 'create' }
    | { type: 'verify'; mailboxID: number; sentAt?: number }
    | { type: 'delete'; mailboxID: number };

export const AliasMailboxesContext = createContext<MaybeNull<AliasMailboxesContextValue>>(null);
export const useAliasMailboxes = createUseContext(AliasMailboxesContext);

export const useMailbox = (mailboxID: number) => {
    const { mailboxes } = useAliasMailboxes();
    return useMemo(() => mailboxes.find((mailbox) => mailbox.MailboxID === mailboxID), [mailboxID, mailboxes]);
};

export const AliasMailboxesProvider: FC<PropsWithChildren> = ({ children }) => {
    const spotlight = useSpotlight();
    const canManage = useSelector(selectCanManageAlias);
    const [action, setAction] = useState<MaybeNull<AliasMailboxAction>>(null);
    const timeout = useRef<Maybe<NodeJS.Timeout>>();

    const [mailboxes, setMailboxes] = useState<Record<number, UserMailboxOutput>>({});

    const sync = useRequest(getMailboxes, {
        loading: true,
        onSuccess: (mailboxes) => setMailboxes(toMap(mailboxes, 'MailboxID')),
    });

    const context = useMemo<AliasMailboxesContextValue>(
        () => ({
            action,
            canManage,
            loading: sync.loading,
            mailboxes: Object.values(mailboxes),
            setAction: (action) => {
                switch (action?.type) {
                    case 'create':
                        if (!canManage) spotlight.setUpselling({ type: 'pass-plus', upsellRef: UpsellRef.SETTING });
                        else setAction({ type: 'create' });
                        break;
                    default:
                        setAction(action);
                }
            },
            onCreate: (mailbox) => {
                setMailboxes((mailboxes) => fullMerge(mailboxes, { [mailbox.MailboxID]: mailbox }));
                if (!mailbox.Verified) setAction({ type: 'verify', mailboxID: mailbox.MailboxID, sentAt: getEpoch() });
                else setAction(null);
            },
            onVerify: (mailbox) => setMailboxes(fullMerge(mailboxes, { [mailbox.MailboxID]: mailbox })),
            onDelete: (mailboxID, transferAliases) => {
                setMailboxes((mailboxes) => objectDelete(mailboxes, mailboxID));
                // call API with delay to get updated alias count, without >2s delay BE may still return old result
                if (transferAliases) {
                    clearTimeout(timeout.current);
                    timeout.current = setTimeout(
                        pipe(sync.revalidate, () => (timeout.current = undefined)),
                        3_000
                    );
                }
            },
            onSetDefault: (mailboxID) =>
                setMailboxes((mailboxes) =>
                    objectMap(mailboxes, (_, mailbox) => ({
                        ...mailbox,
                        IsDefault: !(mailbox.IsDefault || mailbox.MailboxID !== mailboxID),
                    }))
                ),
            getMailboxes: sync.dispatch,
        }),
        [action, canManage, mailboxes, sync.loading]
    );

    useEffect(() => {
        sync.dispatch();
        return clearTimeout(timeout.current);
    }, []);

    return (
        <AliasMailboxesContext.Provider value={context}>
            {children}
            {(() => {
                switch (action?.type) {
                    case 'create':
                        return <AliasMailboxCreateModal />;
                    case 'delete':
                        return (
                            <AliasMailboxDeleteModal
                                mailboxID={action.mailboxID}
                                aliasCount={mailboxes[action.mailboxID].AliasCount}
                            />
                        );
                    case 'verify':
                        return <MailboxVerifyModal mailboxID={action.mailboxID} sentAt={action.sentAt} />;
                }
            })()}
        </AliasMailboxesContext.Provider>
    );
};
