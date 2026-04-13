import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import { getResendSMSVerificationCodeText } from '../../content/helper';

interface Props {
    onResend: () => Promise<void>;
    onClose: () => void;
    open: boolean;
    value: string;
    method: 'email' | 'phone';
}

const RequestNewCodeModal = ({ value, method, open, onResend, onClose }: Props) => {
    const EmailOrPhoneNumber = <strong key="email-or-phone">{value}</strong>;
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Request new code?`}
            ModalContentProps={{
                className: 'text-break',
            }}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        withLoading(onResend())
                            .then(() => {
                                createNotification({
                                    text: c('Info').t`Verification code sent.`,
                                });
                                onClose();
                            })
                            .catch(noop);
                    }}
                >
                    {c('Action').t`Send new code`}
                </Button>,
                <Button onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {method === 'email'
                ? c('Info')
                      .jt`Before sending a new verification code, check your spam folder for ${EmailOrPhoneNumber}.`
                : getResendSMSVerificationCodeText(EmailOrPhoneNumber)}
        </Prompt>
    );
};

export default RequestNewCodeModal;
