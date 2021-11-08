import { c } from 'ttag';
import { deleteRecoverySecrets } from '@proton/shared/lib/api/settingsRecovery';
import { useApi, useLoading, useNotifications } from '../../hooks';
import Button from '../../components/button/Button';
import { FormModal } from '../../components';

interface Props {
    onClose?: () => void;
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
        createNotification({ text: c('Info').t`Recovery files have been voided` });
    };

    return (
        <FormModal
            title={c('Action').t`Void all recovery files?`}
            tiny
            hasClose={false}
            noTitleEllipsis
            onClose={onClose}
            loading={revoking}
            footer={
                <div className="w100">
                    <Button fullWidth color="danger" loading={revoking} onClick={() => withRevoking(handleVoidClick())}>
                        {c('Action').t`Void anyway`}
                    </Button>
                    <Button className="mt1" fullWidth onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                </div>
            }
            {...rest}
        >
            <p className="m0">{c('Info')
                .t`You won't be able to recover encrypted data after an account reset using your downloaded recovery files.`}</p>
        </FormModal>
    );
};

export default VoidRecoveryFilesModal;
