import type { FC } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import {
    EmailVerifyModal,
    SECONDS_BEFORE_RESEND,
    getInitialCountdown,
} from '@proton/pass/components/Layout/Modal/EmailVerifyModal';
import { useCountdown } from '@proton/pass/hooks/useCountdown';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import type { AddressType, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { resendVerificationCode, verifyCustomAddress } from '@proton/pass/store/actions';

export const FORM_ID = 'custom-address-verify';

type Props = { onClose: () => void; sentAt?: number } & MonitorAddress<AddressType.CUSTOM>;

export const CustomAddressVerifyModal: FC<Props> = ({ onClose, email, addressId, sentAt }) => {
    const [remaining, countdown] = useCountdown(getInitialCountdown(sentAt));
    const { createNotification } = useNotifications();

    const verify = useRequest(verifyCustomAddress, {
        onSuccess: onClose,
        onFailure: ({ code }) => {
            if (code === PassErrorCode.NOT_ALLOWED) onClose();
        },
    });

    const resend = useRequest(resendVerificationCode, {
        onSuccess: () => {
            createNotification({ text: c('Info').t`Verification code sent.`, type: 'success' });
            countdown.start(SECONDS_BEFORE_RESEND);
        },
        onFailure: () => countdown.cancel(),
    });

    return (
        <EmailVerifyModal
            email={email}
            onClose={onClose}
            onResend={() => resend.dispatch(addressId)}
            onSubmit={(code) => verify.dispatch({ addressId, code })}
            remaining={remaining}
            resendLoading={resend.loading}
            submitLoading={verify.loading}
        />
    );
};
