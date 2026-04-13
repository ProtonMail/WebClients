import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';

import RequestNewCodeModal from '../components/RequestNewCodeModal';

interface Props {
    value: string;
    onResend: () => Promise<void>;
    recoveryMethod: 'email' | 'phone';
}

export const useRequestNewVerificationCode = ({ value, onResend, recoveryMethod }: Props) => {
    const [newCodeModal, setNewCodeModal] = useState(false);

    const RequestNewCodeLink = (
        <InlineLinkButton className="color-danger" onClick={() => setNewCodeModal(true)} key="request-new-code-link">{c(
            'Action'
        ).t`Request new code`}</InlineLinkButton>
    );

    // translator: full sentence: "Invalid code. Request new code and try again."
    const InvalidCodeErrorMessage = c('Info').jt`Invalid code. ${RequestNewCodeLink} and try again.`;

    const Modal = (
        <RequestNewCodeModal
            method={recoveryMethod}
            value={value}
            onClose={() => setNewCodeModal(false)}
            open={newCodeModal}
            onResend={onResend}
        />
    );

    const AssistiveText = (
        <InlineLinkButton onClick={() => setNewCodeModal(true)}>
            {c('Action').t`Didn't receive a code?`}
        </InlineLinkButton>
    );

    return {
        AssistiveText,
        RequestNewCodeModal: Modal,
        InvalidCodeErrorMessage,
    };
};
