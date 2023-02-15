import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { postVerifyPhone } from '@proton/shared/lib/api/verify';
import { UserSettings } from '@proton/shared/lib/interfaces';

import { ModalProps, Prompt } from '../../../components';
import { useApi } from '../../../hooks';

interface Props extends ModalProps {
    phone: UserSettings['Phone'];
}

const VerifyRecoveryPhoneModal = ({ phone, onClose, ...rest }: Props) => {
    const [loading, setLoading] = useState(false);
    const api = useApi();

    const handleSendVerificationPhoneClick = async () => {
        setLoading(true);
        try {
            // PostVerifyPhone will call /core/v4/verify/phone which should return error 9001 Human Verification.
            // The client will then display the verify modal and replay the endpoint to submit the token and verify the phone number.
            await api(postVerifyPhone());
        } catch (error) {}

        onClose?.();
    };
    return (
        <Prompt
            title={c('Recovery Phone').t`Verify recovery phone?`}
            buttons={[
                <Button loading={loading} shape="solid" color="norm" onClick={handleSendVerificationPhoneClick}>{c(
                    'Recovery Phone'
                ).t`Verify by SMS`}</Button>,
                <Button onClick={onClose} disabled={loading}>{c('Recovery Phone').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Recovery Phone')
                .t`Verifying your phone number increases your account security and allows additional options for recovery.`}
        </Prompt>
    );
};

export default VerifyRecoveryPhoneModal;
