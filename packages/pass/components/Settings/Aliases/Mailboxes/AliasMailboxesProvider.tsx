import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { mailboxVerificationRequired } from '@proton/pass/lib/alias/alias.utils';
import { getMailboxes } from '@proton/pass/store/actions';
import { selectAliasMailboxes, selectCanManageAlias } from '@proton/pass/store/selectors';
import type { MailboxDeleteDTO, Maybe, MaybeNull, UserMailboxOutput } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { AliasMailboxCreateModal } from './AliasMailboxCreateModal';
import { AliasMailboxDeleteModal } from './AliasMailboxDeleteModal';
import { AliasMailboxEditModal } from './AliasMailboxEdit';
import { AliasMailboxEditCancel } from './AliasMailboxEditCancel';
import { MailboxVerifyModal } from './AliasMailboxVerifyModal';

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

export const AliasMailboxesProvider: FC<PropsWithChildren> = ({ children }) => {
    const upsell = useUpselling();
    const canManage = useSelector(selectCanManageAlias);
    const [action, setAction] = useState<MaybeNull<AliasMailboxAction>>(null);
    const timeout = useRef<Maybe<NodeJS.Timeout>>();

    const mailboxes = useSelector(selectAliasMailboxes);
    const sync = useRequest(getMailboxes, { loading: true });

    const onMailboxCreated = useCallback((dto: UserMailboxOutput) => {
        setAction(
            mailboxVerificationRequired(dto)
                ? {
                      type: 'verify',
                      mailboxID: dto.MailboxID,
                      sentAt: getEpoch(),
                  }
                : null
        );
    }, []);

    const onMailboxRemoved = useCallback((dto: MailboxDeleteDTO) => {
        /** Call API with delay to get updated alias count,
         * without >2s delay BE may still return old result */
        if (typeof dto.transferMailboxID === 'number') {
            clearTimeout(timeout.current);
            timeout.current = setTimeout(
                pipe(sync.revalidate, () => (timeout.current = undefined)),
                3_000
            );
        }
    }, []);

    const context = useMemo<AliasMailboxesContextValue>(
        () => ({
            action,
            canManage,
            loading: sync.loading && mailboxes === null,
            mailboxes: Object.values(mailboxes ?? {}),

            setAction: (action) => {
                switch (action?.type) {
                    case 'create':
                        if (!canManage) upsell({ type: 'pass-plus', upsellRef: UpsellRef.SETTING });
                        else setAction({ type: 'create' });
                        break;
                    default:
                        setAction(action);
                }
            },

            getAliasMailboxes: sync.dispatch,
            onMailboxCreated,
            onMailboxRemoved,
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
                        return <AliasMailboxDeleteModal mailboxID={action.mailboxID} />;
                    case 'verify':
                        return <MailboxVerifyModal mailboxID={action.mailboxID} sentAt={action.sentAt} />;
                    case 'edit':
                        return <AliasMailboxEditModal mailboxID={action.mailboxID} />;
                    case 'cancel-edit':
                        return <AliasMailboxEditCancel mailboxID={action.mailboxID} />;
                }
            })()}
        </AliasMailboxesContext.Provider>
    );
};
