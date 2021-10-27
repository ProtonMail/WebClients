import { c } from 'ttag';
import { ConfirmModal } from '@proton/components';

interface Props {
    onClose?: () => void;
    onConfirm?: () => void;
}

const MnemonicResetPasswordConfirmModal = (props: Props) => {
    return (
        <ConfirmModal
            mode="alert"
            title={c('Title').t`Reset password?`}
            confirm={c('Action').t`Reset password`}
            cancel={c('Action').t`Cancel`}
            submitProps={{
                color: 'danger',
            }}
            {...props}
        >
            <p className="m0">
                {c('Info').t`This will sign you out of any active sessions and disable 2-factor authentication.`}
            </p>
        </ConfirmModal>
    );
};

export default MnemonicResetPasswordConfirmModal;
