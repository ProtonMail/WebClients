import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { useApi, useNotifications } from '../../../hooks';

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
        await api(postVerifySend({ Type: 'recovery_email' }));

        createNotification({
            type: 'success',
            text: getVerificationSentText(email.Value),
        });

        onClose?.();
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
