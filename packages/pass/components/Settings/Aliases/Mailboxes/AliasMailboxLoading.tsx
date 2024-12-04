import type { ReactNode } from 'react';
import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { deleteMailbox, resendVerifyMailbox, setDefaultMailbox } from '@proton/pass/store/actions';
import { selectRequestInFlight } from '@proton/pass/store/selectors';

type Props = { mailboxID: number; children: (loading: boolean) => ReactNode };

export const AliasMailboxLoading: FC<Props> = ({ mailboxID, children }) => {
    const deleting = useSelector(selectRequestInFlight(deleteMailbox.requestID({ mailboxID })));
    const defaulting = useSelector(selectRequestInFlight(setDefaultMailbox.requestID({ defaultMailboxID: mailboxID })));
    const verifying = useSelector(selectRequestInFlight(resendVerifyMailbox.requestID(mailboxID)));

    return children(deleting || defaulting || verifying);
};
