import { useState } from 'react';

import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useNotifications } from '../../../hooks';
import HumanVerificationForm from './HumanVerificationForm';
import { isVerifyAddressOwnership } from './helper';
import { type HumanVerificationResult, HumanVerificationSteps, type VerificationModel } from './interface';

interface Props<T extends { humanVerificationResult?: HumanVerificationResult }> extends ModalProps {
    title?: string;
    token: string;
    methods: HumanVerificationMethodType[];
    onSuccess: (data: T, verificationModel?: VerificationModel) => void;
    onVerify: (token: string, tokenType: HumanVerificationMethodType) => Promise<T>;
    onError: (error: any) => void;
}

const HumanVerificationModal = <T extends { humanVerificationResult?: HumanVerificationResult }>({
    title: maybeTitle,
    token,
    methods = [],
    onSuccess,
    onVerify,
    onError,
    onClose = noop,
    ...rest
}: Props<T>) => {
    const theme = useTheme();
    const title = maybeTitle || c('Title').t`Human verification`;
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const [isMandatory, setIsMandatory] = useState<boolean>(true);

    const handleSubmit = async (
        token: string,
        tokenType: HumanVerificationMethodType,
        verificationModel?: VerificationModel
    ) => {
        if (loading) {
            return;
        }
        try {
            const result = await onVerify(token, tokenType);
            createNotification({ text: c('Success').t`Verification successful` });
            if (result) {
                result.humanVerificationResult = {
                    token,
                    tokenType,
                    verificationModel,
                };
            }
            onSuccess(result);
            onClose();
        } catch (error: any) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createNotification({ text: c('Error').t`Invalid verification code`, type: 'error' });
            }

            // Captcha is just given one attempt, and if the resubmitted request did not give invalid token,
            // it probably means the verification succeeded, but the original request failed. So then we error out.
            if (tokenType === 'captcha' || code !== API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                onError(error);
                onClose();
                return;
            }

            throw error;
        }
    };

    return (
        <Modal
            className="human-verification-modal"
            size="small"
            onClose={onClose}
            data-testid="verification"
            disableCloseOnEscape={isMandatory}
            {...rest}
        >
            <ModalHeader title={title} hasClose={!isMandatory} />
            <ModalContent>
                <HumanVerificationForm
                    theme={theme.information.dark ? 'dark' : undefined}
                    step={step}
                    onChangeStep={setStep}
                    onSubmit={(token, tokenType, verificationModel) =>
                        withLoading(handleSubmit(token, tokenType, verificationModel))
                    }
                    onClose={onClose}
                    methods={methods}
                    token={token}
                    onLoaded={(ownershipCache) => {
                        setIsMandatory(isVerifyAddressOwnership(ownershipCache['ownership-email'].result));
                    }}
                />
            </ModalContent>
        </Modal>
    );
};

export default HumanVerificationModal;
