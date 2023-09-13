import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { updateSessionAccountRecovery } from '@proton/shared/lib/api/sessionRecovery';
import noop from '@proton/utils/noop';

import { Prompt } from '../../components';
import { useApi, useEventManager } from '../../hooks';

interface Props {
    onClose: () => void;
    open: boolean;
}

const ConfirmDisableSessionRecoveryModal = ({ open, onClose }: Props) => {
    const api = useApi();
    const { call } = useEventManager();

    const [submitting, withSubmitting] = useLoading();

    const handleDisableSessionRecoveryToggle = async () => {
        await api(updateSessionAccountRecovery({ SessionAccountRecovery: 0 }));
        await call();
        onClose();
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Prompt
            open={open}
            onClose={handleClose}
            title={c('Title').t`Disable password reset?`}
            buttons={[
                <Button
                    color="danger"
                    loading={submitting}
                    onClick={() => {
                        void withSubmitting(handleDisableSessionRecoveryToggle());
                    }}
                >
                    {c('Action').t`Disable password reset`}
                </Button>,
                <Button onClick={onClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>{c('Info').t`You will no longer be able to request a password reset from your account settings.`}</p>
            <p>{c('Info').t`Make sure you have access to a recovery method.`}</p>
        </Prompt>
    );
};

export default ConfirmDisableSessionRecoveryModal;
