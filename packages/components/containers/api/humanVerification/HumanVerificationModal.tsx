import { useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '../../../components';
import { useNotifications } from '../../../hooks';
import HumanVerificationForm from './HumanVerificationForm';
import { HumanVerificationSteps } from './interface';

interface Props<T> extends ModalProps {
    title?: string;
    token: string;
    methods: HumanVerificationMethodType[];
    onSuccess: (data: T) => void;
    onVerify: (token: string, tokenType: HumanVerificationMethodType) => Promise<T>;
    onError: (error: any) => void;
}

const HumanVerificationModal = <T,>({
    title: maybeTitle,
    token,
    methods = [],
    onSuccess,
    onVerify,
    onError,
    onClose = noop,
    ...rest
}: Props<T>) => {
    const title = maybeTitle || c('Title').t`Human verification`;
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const handleSubmit = async (token: string, tokenType: HumanVerificationMethodType) => {
        if (loading) {
            return;
        }
        try {
            const result = await onVerify(token, tokenType);
            createNotification({ text: c('Success').t`Verification successful` });
            onSuccess(result);
            onClose();
        } catch (error: any) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createNotification({ text: c('Error').t`Invalid verification code`, type: 'error' });
            }

            // Captcha is just given one attempt, and if the resubmitted request did not give invalid token,
            // it probably means the verification succeeded, but the original request failed. So then we error out.
            if (tokenType === 'captcha' || Code !== API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                onError(error);
                onClose();
                return;
            }

            throw error;
        }
    };

    return (
        <Modal className="human-verification-modal" size="small" onClose={onClose} data-testid="verification" {...rest}>
            <ModalHeader title={title} />
            <ModalContent>
                <HumanVerificationForm
                    step={step}
                    onChangeStep={setStep}
                    onSubmit={(token, tokenType) => withLoading(handleSubmit(token, tokenType))}
                    onClose={onClose}
                    methods={methods}
                    token={token}
                />
            </ModalContent>
        </Modal>
    );
};

export default HumanVerificationModal;
