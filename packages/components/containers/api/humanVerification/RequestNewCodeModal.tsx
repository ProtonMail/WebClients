import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import { Prompt } from '../../../components';
import { VerificationModel } from './interface';

interface Props {
    verificationModel: VerificationModel;
    onEdit: () => void;
    onResend: () => Promise<void>;
    onClose: () => void;
    open: boolean;
}

const RequestNewCodeModal = ({ open, verificationModel, onEdit, onResend, onClose }: Props) => {
    const strong = <strong key="email">{verificationModel.value}</strong>;
    const [loading, withLoading] = useLoading();
    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Request new code`}
            ModalContentProps={{
                className: 'text-break',
            }}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        withLoading(onResend()).then(onClose).catch(noop);
                    }}
                >
                    {c('Action').t`Request new code`}
                </Button>,
                <Button
                    onClick={() => {
                        onClose();
                        onEdit();
                    }}
                    disabled={loading}
                >
                    {(() => {
                        if (verificationModel.method === 'ownership-email') {
                            if (verificationModel.type === 'external') {
                                return c('Action').t`Edit email address`;
                            }
                            if (verificationModel.type === 'login') {
                                return c('Action').t`Edit sign-in details`;
                            }
                        }
                        if (verificationModel.method === 'ownership-sms') {
                            if (verificationModel.type === 'login') {
                                return c('Action').t`Edit sign-in details`;
                            }
                        }
                        if (verificationModel.method === 'email') {
                            return c('Action').t`Edit email address`;
                        }
                        if (verificationModel.method === 'sms') {
                            return c('Action').t`Edit phone number`;
                        }
                    })()}
                </Button>,
                <Button onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {(() => {
                if (verificationModel.method === 'ownership-email' || verificationModel.method === 'ownership-sms') {
                    if (verificationModel.type === 'login' || verificationModel.type === 'external') {
                        return c('Info').jt`We'll send a new verification code to ${strong}`;
                    }
                }
                if (verificationModel.method === 'email') {
                    return c('Info')
                        .jt`Before requesting a new verification code, check your spam folder and check that ${strong} is the correct address.`;
                }
                if (verificationModel.method === 'sms') {
                    return c('Info')
                        .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this phone number is incorrect, click "Edit" to correct it.`;
                }
            })()}
        </Prompt>
    );
};

export default RequestNewCodeModal;
