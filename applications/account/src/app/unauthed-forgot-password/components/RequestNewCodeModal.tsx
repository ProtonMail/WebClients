import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';

import { getResendSMSVerificationCodeText } from '../../content/helper';

interface Props {
    onResend: () => void;
    onClose: () => void;
    open: boolean;
    /** The new code is being sent; the dialog closes once it is. */
    loading: boolean;
    value: string;
    method: 'email' | 'phone';
}

const RequestNewCodeModal = ({ value, method, open, loading, onResend, onClose }: Props) => {
    const EmailOrPhoneNumber = <strong key="email-or-phone">{value}</strong>;

    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Request new code?`}
            ModalContentProps={{
                className: 'text-break',
            }}
            buttons={[
                <Button color="norm" loading={loading} onClick={onResend}>
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
