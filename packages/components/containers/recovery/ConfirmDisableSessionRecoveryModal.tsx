import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateSessionAccountRecovery } from '@proton/shared/lib/api/sessionRecovery';
import noop from '@proton/utils/noop';

interface Props {
    onClose: () => void;
    open: boolean;
}

const ConfirmDisableSessionRecoveryModal = ({ open, onClose }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();

    const [submitting, withSubmitting] = useLoading();

    const handleDisableSessionRecoveryToggle = async () => {
        try {
            await api(updateSessionAccountRecovery({ SessionAccountRecovery: 0 }));
            await dispatch(userSettingsThunk({ cache: CacheType.None }));
            onClose();
            metrics.core_session_recovery_settings_update_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_session_recovery_settings_update_total.increment({
                    status,
                })
            );
        }
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Prompt
            open={open}
            onClose={handleClose}
            title={c('session_recovery:disable:title').t`Disable password reset?`}
            buttons={[
                <Button
                    color="danger"
                    loading={submitting}
                    onClick={() => {
                        void withSubmitting(handleDisableSessionRecoveryToggle());
                    }}
                >
                    {c('session_recovery:disable:action').t`Disable password reset`}
                </Button>,
                <Button onClick={onClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>
                {c('session_recovery:disable:info')
                    .t`You will no longer be able to request a password reset from your account settings.`}
            </p>
            <p>{c('session_recovery:disable:info').t`Make sure you have access to a recovery method.`}</p>
        </Prompt>
    );
};

export default ConfirmDisableSessionRecoveryModal;
