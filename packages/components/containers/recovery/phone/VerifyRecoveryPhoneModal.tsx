import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { postVerifyPhone } from '@proton/shared/lib/api/verify';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../../components';
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
