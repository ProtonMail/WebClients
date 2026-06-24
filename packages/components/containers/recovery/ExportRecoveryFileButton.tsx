import { c } from 'ttag';

import { downloadRecoveryFileThunk } from '@proton/account/recovery/recoveryFile';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { RecoveryFileShareAbortedError, exportRecoveryFile } from '@proton/shared/lib/recoveryFile/recoveryFile';
import { useFlag } from '@proton/unleash/useFlag';

import { useRecoverySettingsTelemetry } from './recoverySettingsTelemetry';

interface Props extends Omit<ButtonProps, 'onClick'> {}

const ExportRecoveryFileButton = ({ children = c('Action').t`Download recovery file`, ...rest }: Props) => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const dispatch = useDispatch();
    const isShareFeatureEnabled = useFlag('RecoveryFileShareEnabled');

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const handleClick = async () => {
        try {
            const recoveryFileContents = await dispatch(downloadRecoveryFileThunk());
            if (recoveryFileContents) {
                await exportRecoveryFile(recoveryFileContents, isShareFeatureEnabled);
                sendRecoverySettingEnabled({ setting: 'recovery_file_download' });
                createNotification({ text: c('Info').t`Recovery file downloaded` });
            }
        } catch (error) {
            if (!(error instanceof RecoveryFileShareAbortedError)) {
                createNotification({
                    text: c('Info').t`Unable to verify recovery file signature. Please contact support.`,
                    type: 'error',
                });
            }
        }
    };

    return (
        <Button
            onClick={() => withLoading(handleClick())}
            loading={loading}
            {...rest}
            className="inline-flex gap-2 items-center"
        >
            {children}
        </Button>
    );
};

export default ExportRecoveryFileButton;
