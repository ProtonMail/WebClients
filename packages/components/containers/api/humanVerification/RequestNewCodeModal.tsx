import { c } from 'ttag';

import { AlertModal, Button } from '../../../components';
import { useLoading } from '../../../hooks';
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
        <AlertModal
            open={open}
            title={c('Title').t`Request new code`}
            buttons={[
                <Button
                    color="norm"
                    type="button"
                    fullWidth
                    loading={loading}
                    onClick={async () => {
                        await withLoading(onResend());
                        onClose();
                    }}
                >
                    {c('Action').t`Request new code`}
                </Button>,
                <Button
                    color="weak"
                    type="button"
                    onClick={() => {
                        onClose();
                        onEdit();
                    }}
                    disabled={loading}
                    fullWidth
                >
                    {verificationModel.method === 'email'
                        ? c('Action').t`Edit email address`
                        : c('Action').t`Edit phone number`}
                </Button>,
                <Button color="weak" type="button" onClick={onClose} disabled={loading} fullWidth>
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
