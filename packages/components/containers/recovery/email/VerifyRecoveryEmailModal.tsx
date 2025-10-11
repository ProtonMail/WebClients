import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { UserSettings } from '@proton/shared/lib/interfaces';

export const getVerificationSentText = (address: string) => {
    return c('Email verification').t`Verification email sent to ${address}`;
};

interface Props extends ModalProps {
    email: UserSettings['Email'];
}

const VerifyRecoveryEmailModal = ({ email, onClose, ...rest }: Props) => {
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const { createNotification } = useNotifications();

    const handleSendVerificationEmailClick = async () => {
        setLoading(true);
        try {
            await api(postVerifySend({ Type: 'recovery_email' }));

            createNotification({
                type: 'success',
                text: getVerificationSentText(email.Value),
            });

            onClose?.();
        } catch (error) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.BANNED) {
                onClose?.();
            } else {
                throw error;
            }
        }
    };
    return (
        <Prompt
            title={c('Recovery Email').t`Verify recovery email?`}
            buttons={[
                <Button loading={loading} shape="solid" color="norm" onClick={handleSendVerificationEmailClick}>{c(
                    'Recovery Email'
                ).t`Verify with email`}</Button>,
                <Button onClick={onClose} disabled={loading}>{c('Recovery Email').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Recovery Email')
                .t`Verifying your email address increases your account security and allows additional options for recovery.`}
        </Prompt>
    );
};

export default VerifyRecoveryEmailModal;
