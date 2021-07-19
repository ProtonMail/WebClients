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
            <p className="mt0">
                {c('Info')
                    .t`If you proceed, you will be required to reset your password and you will be logged out of all other active sessions.`}
            </p>
            <p className="mb0">{c('Info').t`This will also disable two-factor authentication.`}</p>
        </ConfirmModal>
    );
};

export default MnemonicResetPasswordConfirmModal;
