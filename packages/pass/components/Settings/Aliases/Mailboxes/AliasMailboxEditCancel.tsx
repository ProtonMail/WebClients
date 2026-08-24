import type { FC } from 'react';

import { c } from 'ttag';

import { useRequest } from '../../../../hooks/useRequest';
import { cancelMailboxEdit } from '../../../../store/actions';
import { ConfirmationPrompt } from '../../../Confirmation/ConfirmationPrompt';
import { useAliasMailboxes } from './AliasMailboxesContext';

type Props = { mailboxID: number };

export const AliasMailboxEditCancel: FC<Props> = ({ mailboxID }) => {
    const { setAction } = useAliasMailboxes();
    const onClose = () => setAction(null);
    const cancel = useRequest(cancelMailboxEdit, { onSuccess: onClose });

    return (
        <ConfirmationPrompt
            loading={cancel.loading}
            title={c('Title').t`Cancel changing your email?`}
            message={<div>{c('Info').t`This mailbox will use your previous email.`}</div>}
            onCancel={onClose}
            onConfirm={() => cancel.dispatch(mailboxID)}
        />
    );
};
