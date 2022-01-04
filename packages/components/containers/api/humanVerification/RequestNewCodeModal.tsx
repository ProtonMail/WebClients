import { c } from 'ttag';

import { AlertModal, Button } from '../../../components';
import { useLoading } from '../../../hooks';
import { VerificationModel } from './interface';
import { noop } from '@proton/shared/lib/helpers/function';

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
        <AlertModal
            open={open}
            onClose={onClose}
            title={c('Title').t`Request new code`}
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
                    {verificationModel.method === 'email'
                        ? c('Action').t`Edit email address`
                        : c('Action').t`Edit phone number`}
                </Button>,
                <Button onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {verificationModel.method === 'email'
                ? c('Info')
                      .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this email address is incorrect, click "Edit" to correct it.`
                : c('Info')
                      .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this phone number is incorrect, click "Edit" to correct it.`}
        </AlertModal>
    );
};

export default RequestNewCodeModal;
