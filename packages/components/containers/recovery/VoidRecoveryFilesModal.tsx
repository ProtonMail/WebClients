import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { deleteRecoverySecrets } from '@proton/shared/lib/api/settingsRecovery';

import type { ModalProps } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends Omit<ModalProps, 'children' | 'size'> {
    deviceRecoveryEnabled: boolean | undefined;
    onVoid: () => Promise<void>;
}

const VoidRecoveryFilesModal = ({ deviceRecoveryEnabled, onVoid, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();

    const [revoking, withRevoking] = useLoading();

    const handleVoidClick = async () => {
        await api(deleteRecoverySecrets());
        await call();
        await onVoid();
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
                {deviceRecoveryEnabled
                    ? c('Info')
                          .t`You won’t be able to recover locked data using your downloaded recovery files. This will also disable device-based recovery.`
                    : c('Info').t`You won’t be able to recover locked data using your downloaded recovery files.`}
            </p>
        </Prompt>
    );
};

export default VoidRecoveryFilesModal;
