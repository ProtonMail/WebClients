import type { ReactNode } from 'react';
import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    cancelMailboxEdit,
    deleteMailbox,
    editMailbox,
    resendVerifyMailbox,
    setDefaultMailbox,
} from '@proton/pass/store/actions';
import { selectRequestInFlight } from '@proton/pass/store/selectors';

type Props = { mailboxID: number; children: (loading: boolean) => ReactNode };

export const AliasMailboxLoading: FC<Props> = ({ mailboxID, children }) => {
    const mailboxDTO = useMemo(() => ({ mailboxID }), [mailboxID]);

    const deleting = useSelector(selectRequestInFlight(deleteMailbox.requestID(mailboxDTO)));
    const defaulting = useSelector(selectRequestInFlight(setDefaultMailbox.requestID(mailboxDTO)));
    const verifying = useSelector(selectRequestInFlight(resendVerifyMailbox.requestID(mailboxID)));
    const editing = useSelector(selectRequestInFlight(editMailbox.requestID(mailboxDTO)));
    const canceling = useSelector(selectRequestInFlight(cancelMailboxEdit.requestID(mailboxID)));

    return children(deleting || defaulting || verifying || editing || canceling);
};
