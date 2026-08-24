import type { FC, PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { UpsellRef } from '../../../../constants';
import { useRequest } from '../../../../hooks/useRequest';
import { mailboxVerificationRequired } from '../../../../lib/alias/alias.utils';
import { getMailboxes } from '../../../../store/actions';
import { selectAliasMailboxes, selectCanManageAlias } from '../../../../store/selectors';
import type { MailboxDeleteDTO, Maybe, MaybeNull, UserMailboxOutput } from '../../../../types';
import { pipe } from '../../../../utils/fp/pipe';
import { getEpoch } from '../../../../utils/time/epoch';
import { useUpselling } from '../../../Upsell/UpsellingProvider';
import { AliasMailboxCreateModal } from './AliasMailboxCreateModal';
import { AliasMailboxDeleteModal } from './AliasMailboxDeleteModal';
import { AliasMailboxEditModal } from './AliasMailboxEdit';
import { AliasMailboxEditCancel } from './AliasMailboxEditCancel';
import { MailboxVerifyModal } from './AliasMailboxVerifyModal';
import {
    type AliasMailboxAction,
    AliasMailboxesContext,
    type AliasMailboxesContextValue,
} from './AliasMailboxesContext';

export type { AliasMailboxAction } from './AliasMailboxesContext';
export { useAliasMailboxes, useMailbox } from './AliasMailboxesContext';

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
