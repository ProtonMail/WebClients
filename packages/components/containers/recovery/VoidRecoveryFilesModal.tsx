import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { deleteRecoverySecrets } from '@proton/shared/lib/api/settingsRecovery';

import { ModalProps, Prompt } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends Omit<ModalProps, 'children' | 'size'> {
    /**
     * Remove when TrustedDeviceRecovery feature is removed
     */
    trustedDeviceRecovery: boolean | undefined;
}

const VoidRecoveryFilesModal = ({ trustedDeviceRecovery, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();

    const [revoking, withRevoking] = useLoading();

    const handleVoidClick = async () => {
        await api(deleteRecoverySecrets());
        await call();
        createNotification({ type: 'info', text: c('Info').t`Recovery files have been voided` });
        onClose?.();
    };

    return (
        <Prompt
            {...rest}
            title={c('Action').t`Void all recovery files?`}
            buttons={[
                <Button color="danger" loading={revoking} onClick={() => withRevoking(handleVoidClick())}>
                    {c('Action').t`Void`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m-0">
                {trustedDeviceRecovery
                    ? c('Info')
                          .t`You won’t be able to recover locked data using your downloaded recovery files. This will also void trusted device-recovery information.`
                    : c('Info').t`You won’t be able to recover locked data using your downloaded recovery files.`}
            </p>
        </Prompt>
    );
};

export default VoidRecoveryFilesModal;
