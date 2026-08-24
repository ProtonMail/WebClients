import { type FC, useEffect } from 'react';

import { useCountdown } from '../../../../hooks/useCountdown';
import { useRequest } from '../../../../hooks/useRequest';
import { resendVerifyMailbox, validateMailbox } from '../../../../store/actions';
import { EmailVerifyModal, SECONDS_BEFORE_RESEND, getInitialCountdown } from '../../../Layout/Modal/EmailVerifyModal';
import { useAliasMailboxes, useMailbox } from './AliasMailboxesContext';

type Props = { mailboxID: number; sentAt?: number };

export const MailboxVerifyModal: FC<Props> = ({ mailboxID, sentAt }) => {
    const { setAction } = useAliasMailboxes();
    const mailbox = useMailbox(mailboxID);
    const [remaining, countdown] = useCountdown(getInitialCountdown(sentAt));

    const onClose = () => setAction(null);

    const verify = useRequest(validateMailbox, { onSuccess: onClose });
    const resend = useRequest(resendVerifyMailbox, {
        onSuccess: () => countdown.start(SECONDS_BEFORE_RESEND),
        onFailure: countdown.cancel,
    });

    useEffect(() => {
        if (!mailbox) onClose();
    }, [mailbox]);

    return (
        mailbox && (
            <EmailVerifyModal
                email={mailbox.PendingEmail ?? mailbox.Email}
                onClose={onClose}
                onResend={() => resend.dispatch(mailboxID)}
                onSubmit={(code) => verify.dispatch({ mailboxID, code })}
                remaining={remaining}
                resendLoading={resend.loading}
                submitLoading={verify.loading}
            />
        )
    );
};
