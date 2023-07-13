import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { setNewRecoverySecret } from '@proton/shared/lib/api/settingsRecovery';
import {
    exportRecoveryFile,
    generateRecoverySecret,
    validateRecoverySecret,
} from '@proton/shared/lib/recoveryFile/recoveryFile';

import { useApi, useEventManager, useNotifications, usePrimaryRecoverySecret, useUserKeys } from '../../hooks';

interface Props extends Omit<ButtonProps, 'onClick'> {}

const ExportRecoveryFileButton = ({
    loading: loadingProp,
    children = c('Action').t`Download recovery file`,
    ...rest
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const [userKeys, loadingUserKeys] = useUserKeys();

    const primaryRecoverySecret = usePrimaryRecoverySecret();

    const [loading, withLoading] = useLoading();

    const exportRecoveryFileWithNotification: typeof exportRecoveryFile = async (args) => {
        await exportRecoveryFile(args);
        createNotification({ text: c('Info').t`Recovery file downloaded` });
    };

    const handleClick = async () => {
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            return;
        }

        if (!primaryRecoverySecret) {
            const { recoverySecret, signature } = await generateRecoverySecret(primaryUserKey.privateKey);
            await api(
                setNewRecoverySecret({
                    RecoverySecret: recoverySecret,
                    Signature: signature,
                })
            );
            await exportRecoveryFileWithNotification({ recoverySecret, userKeys });
            await call();
            return;
        }

        const valid = await validateRecoverySecret(primaryRecoverySecret, primaryUserKey.publicKey);
        if (!valid) {
            createNotification({
                text: c('Info').t`Unable to verify recovery file signature. Please contact support.`,
                type: 'error',
            });
            return;
        }

        await exportRecoveryFileWithNotification({
            recoverySecret: primaryRecoverySecret.RecoverySecret,
            userKeys,
        });
    };

    return (
        <Button
            onClick={() => withLoading(handleClick())}
            loading={loadingUserKeys || loading || loadingProp}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default ExportRecoveryFileButton;
