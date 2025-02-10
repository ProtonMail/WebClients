import { type FC } from 'react';

import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { cancelMailboxEdit } from '@proton/pass/store/actions';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { mailboxID: number };

export const AliasMailboxEditCancel: FC<Props> = ({ mailboxID }) => {
    const { onCancelEdit, setAction } = useAliasMailboxes();
    const onClose = () => setAction(null);

    const cancelMailboxChange = useRequest(cancelMailboxEdit, {
        onSuccess: (mailboxID) => {
            onCancelEdit(mailboxID);
            onClose();
        },
    });

    return (
        <ConfirmationPrompt
            onCancel={onClose}
            onConfirm={() => cancelMailboxChange.dispatch(mailboxID)}
            title={c('Title').t`Cancel changing your email?`}
            message={<div>{c('Info').t`This mailbox will use your previous email.`}</div>}
        />
    );
};
