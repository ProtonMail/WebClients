import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import {
    EmailVerifyModal,
    SECONDS_BEFORE_RESEND,
    getInitialCountdown,
} from '@proton/pass/components/Layout/Modal/EmailVerifyModal';
import { useCountdown } from '@proton/pass/hooks/useCountdown';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { resendVerifyMailbox, validateMailbox } from '@proton/pass/store/actions';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAliasMailboxes, useMailbox } from './AliasMailboxesProvider';

type Props = { onClose: () => void; mailboxID: number; sentAt: number };

export const MailboxVerifyModal: FC<Props> = ({ onClose, mailboxID, sentAt }) => {
    const { onDelete, onVerify } = useAliasMailboxes();
    const mailbox = useMailbox(mailboxID);

    const [remaining, countdown] = useCountdown(getInitialCountdown(sentAt));
    const { createNotification } = useNotifications();

    const verify = useRequest(validateMailbox, {
        onSuccess: pipe(onVerify, onClose),
        onFailure: ({ code }) => {
            if (code === PassErrorCode.NOT_ALLOWED) {
                onDelete(mailboxID);
                onClose();
            }
        },
    });

    const resend = useRequest(resendVerifyMailbox, {
        onSuccess: () => {
            createNotification({ text: c('Info').t`Verification code sent.`, type: 'success' });
            countdown.start(SECONDS_BEFORE_RESEND);
        },
        onFailure: countdown.cancel,
    });

    useEffect(() => {
        if (!mailbox) onClose();
    }, [mailbox]);

    return (
        mailbox && (
            <EmailVerifyModal
                email={mailbox.Email}
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
