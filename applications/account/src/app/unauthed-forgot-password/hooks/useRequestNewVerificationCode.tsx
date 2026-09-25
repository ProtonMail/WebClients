import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import RequestNewCodeModal from '../components/RequestNewCodeModal';

/** The links that open the new code dialog: under the code field, and in the invalid code error. */
export const useNewCodeLinks = ({ onRequestNewCode }: { onRequestNewCode: () => void }) => {
    const RequestNewCodeLink = (
        <InlineLinkButton className="color-danger" onClick={onRequestNewCode} key="request-new-code-link">{c('Action')
            .t`Request new code`}</InlineLinkButton>
    );

    // translator: full sentence: "Invalid code. Request new code and try again."
    const InvalidCodeErrorMessage = c('Info').jt`Invalid code. ${RequestNewCodeLink} and try again.`;

    const AssistiveText = (
        <InlineLinkButton onClick={onRequestNewCode}>{c('Action').t`Didn't receive a code?`}</InlineLinkButton>
    );

    return { InvalidCodeErrorMessage, AssistiveText };
};

/** Tells the user the new code was sent. */
export const useNotifyCodeSent = () => {
    const { createNotification } = useNotifications();
    return () => createNotification({ text: c('Info').t`Verification code sent.` });
};

interface Props {
    value: string;
    onResend: () => Promise<void>;
    recoveryMethod: 'email' | 'phone';
}

/** The new code dialog and its links, for a form that sends the code itself (`onResend`). */
export const useRequestNewVerificationCode = ({ value, onResend, recoveryMethod }: Props) => {
    const [open, setOpen] = useState(false);
    const [loading, withLoading] = useLoading();
    const notifyCodeSent = useNotifyCodeSent();
    const { InvalidCodeErrorMessage, AssistiveText } = useNewCodeLinks({ onRequestNewCode: () => setOpen(true) });

    const Modal = (
        <RequestNewCodeModal
            method={recoveryMethod}
            value={value}
            open={open}
            loading={loading}
            onClose={() => setOpen(false)}
            onResend={() => {
                withLoading(onResend())
                    .then(() => {
                        notifyCodeSent();
                        setOpen(false);
                    })
                    .catch(noop);
            }}
        />
    );

    return {
        AssistiveText,
        RequestNewCodeModal: Modal,
        InvalidCodeErrorMessage,
    };
};
