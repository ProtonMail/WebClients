import { c } from 'ttag';
import { AlertModal, Button } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface ModalProps {
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
}

const ValidateResetTokenConfirmModal = ({ onClose, onConfirm, open }: ModalProps) => {
    const loseAllData = (
        <span className="text-bold" key="lose-access">{c('Info').t`lose access to all current encrypted data`}</span>
    );
    return (
        <AlertModal
            open={open}
            onClose={onClose}
            title={c('Title').t`Warning!`}
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
            <div>
                <p className="mt0">{c('Info')
                    .jt`You will ${loseAllData} in your ${BRAND_NAME} Account. To restore it, you will need to enter your old password.`}</p>
                <p className="mt0">{c('Info')
                    .t`This will also disable any two-factor authentication method associated with this account.`}</p>
                <p className="mt0 mb0">{c('Info').t`Continue anyway?`}</p>
            </div>
        </AlertModal>
    );
};

export default ValidateResetTokenConfirmModal;
