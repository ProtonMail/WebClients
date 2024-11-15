import { type FC, useEffect, useMemo } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import {
    EmailVerifyModal,
    SECONDS_BEFORE_RESEND,
    getInitialCountdown,
} from '@proton/pass/components/Layout/Modal/EmailVerifyModal';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useCountdown } from '@proton/pass/hooks/useCountdown';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { resendVerifyMailbox, validateMailbox } from '@proton/pass/store/actions';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { onClose: () => void; mailboxID: number; sentAt: number };

export const MailboxVerifyModal: FC<Props> = ({ onClose, mailboxID, sentAt }) => {
    const { mailboxes, onDelete, onVerify } = useAliasMailboxes();
    const mailbox = useMemo(() => mailboxes.find((mailbox) => mailbox.MailboxID === mailboxID), [mailboxID, mailboxes]);

    const [remaining, countdown] = useCountdown(getInitialCountdown(sentAt));
    const { createNotification } = useNotifications();

    const verify = useRequest(validateMailbox, {
        onSuccess: pipe(prop('data'), onVerify, onClose),
        onFailure: ({ data }) => {
            if (data.code === PassErrorCode.NOT_ALLOWED) {
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
