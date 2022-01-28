import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

import { AlertModal, Button } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    edit?: string;
    request?: string;
    onEdit: () => void;
    onResend: () => Promise<void>;
    onClose: () => void;
    open: boolean;
}

const InvalidVerificationCodeModal = ({
    onEdit,
    onResend,
    onClose,
    open,
    edit = c('Action').t`Try another method`,
    request = c('Action').t`Request new code`,
}: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <AlertModal
            open={open}
            title={c('Title').t`Invalid verification code`}
            onClose={onClose}
            buttons={[
                <Button
                    loading={loading}
                    color="norm"
                    onClick={() => {
                        withLoading(onResend()).then(onClose).catch(noop);
                    }}
                >
                    {request}
                </Button>,
                <Button
                    disabled={loading}
                    onClick={() => {
                        onClose();
                        onEdit();
                    }}
                >
                    {edit}
                </Button>,
            ]}
        >
            {c('Info').t`Would you like to receive a new verification code or use an alternative verification method?`}
        </AlertModal>
    );
};

export default InvalidVerificationCodeModal;
