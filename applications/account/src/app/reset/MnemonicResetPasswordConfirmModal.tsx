import { c } from 'ttag';
import { AlertModal, Button } from '@proton/components';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
}

const MnemonicResetPasswordConfirmModal = ({ onClose, onConfirm, open }: Props) => {
    return (
        <AlertModal
            open={open}
            onClose={onClose}
            title={c('Title').t`Reset password?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {c('Action').t`Reset password`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m0">
                {c('Info').t`This will sign you out of any active sessions and disable 2-factor authentication.`}
            </p>
        </AlertModal>
    );
};

export default MnemonicResetPasswordConfirmModal;
