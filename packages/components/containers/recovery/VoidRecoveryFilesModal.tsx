import { c } from 'ttag';
import { deleteRecoverySecrets } from '@proton/shared/lib/api/settingsRecovery';
import { useApi, useLoading, useNotifications } from '../../hooks';
import Button from '../../components/button/Button';
import { AlertModal, ModalProps } from '../../components';

interface Props extends Omit<ModalProps, 'children' | 'size'> {
    onSuccess: () => void;
}

const VoidRecoveryFilesModal = ({ onClose, onSuccess, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const [revoking, withRevoking] = useLoading();

    const handleVoidClick = async () => {
        await api(deleteRecoverySecrets());
        onSuccess();
        onClose?.();
        createNotification({ type: 'info', text: c('Info').t`Recovery files have been voided` });
    };

    return (
        <AlertModal
            {...rest}
            title={c('Action').t`Void all recovery files?`}
            buttons={[
                <Button color="danger" loading={revoking} onClick={() => withRevoking(handleVoidClick())}>
                    {c('Action').t`Void anyway`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m0">
                {c('Info')
                    .t`You won't be able to recover encrypted data after an account reset using your downloaded recovery files.`}
            </p>
        </AlertModal>
    );
};

export default VoidRecoveryFilesModal;
