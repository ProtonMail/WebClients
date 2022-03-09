import { useState } from 'react';
import { c } from 'ttag';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import { UserSettings } from '@proton/shared/lib/interfaces';

import { AlertModal, Button, ModalProps } from '../../../components';
import { useApi, useNotifications } from '../../../hooks';

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
            text: c('Recovery Email').t`Verification email sent to ${email.Value}`,
        });

        onClose?.();
    };
    return (
        <AlertModal
            title={c('Recovery Email').t`Verify recovery email?`}
            buttons={[
                <Button loading={loading} shape="solid" color="norm" onClick={handleSendVerificationEmailClick}>{c(
                    'Recovery Email'
                ).t`Send verification email`}</Button>,
                <Button onClick={onClose} disabled={loading}>{c('Recovery Email').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Recovery Email')
                .t`Verifying your email address increases your account security and allows additional options for recovery.`}
        </AlertModal>
    );
};

export default VerifyRecoveryEmailModal;
