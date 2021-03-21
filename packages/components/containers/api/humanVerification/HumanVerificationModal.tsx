import React, { useState } from 'react';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { c } from 'ttag';
import { HumanVerificationMethodType } from 'proton-shared/lib/interfaces';

import { FormModal } from '../../../components';
import { useLoading, useNotifications } from '../../../hooks';
import './HumanVerificationModal.scss';
import HumanVerificationForm, { Steps } from './HumanVerificationForm';

interface Props<T> {
    token: string;
    methods: HumanVerificationMethodType[];
    onSuccess: (data: T) => void;
    onVerify: (token: string, tokenType: HumanVerificationMethodType) => Promise<T>;
    [key: string]: any;
}

const HumanVerificationModal = <T,>({ token, methods = [], onSuccess, onVerify, ...rest }: Props<T>) => {
    const title = c('Title').t`Human verification`;
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(Steps.ENTER_DESTINATION);

    const handleSubmit = async (token: string, tokenType: HumanVerificationMethodType) => {
        if (loading) {
            return;
        }
        try {
            const result = await onVerify(token, tokenType);
            createNotification({ text: c('Success').t`Verification successful` });
            onSuccess(result);
            rest.onClose();
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createNotification({ text: c('Error').t`Invalid verification code`, type: 'error' });
            }

            // Captcha is just given one attempt, and if the resubmitted request did not give invalid token,
            // it probably means the verification succeeded, but the original request failed. So then we error out.
            if (tokenType === 'captcha' || Code !== API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                rest.onClose();
            }

            throw error;
        }
    };

    return (
        <FormModal className="human-verification-modal modal--height-auto" title={title} footer={null} {...rest}>
            <HumanVerificationForm
                step={step}
                onChangeStep={setStep}
                onSubmit={(...args) => withLoading(handleSubmit(...args))}
                methods={methods}
                token={token}
            />
        </FormModal>
    );
};

export default HumanVerificationModal;
