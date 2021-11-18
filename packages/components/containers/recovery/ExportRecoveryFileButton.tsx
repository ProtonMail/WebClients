import { c } from 'ttag';
import {
    exportRecoveryFile,
    generateRecoverySecret,
    validateRecoverySecret,
} from '@proton/shared/lib/recoveryFile/recoveryFile';
import { setNewRecoverySecret } from '@proton/shared/lib/api/settingsRecovery';
import {
    useApi,
    useEventManager,
    useLoading,
    useNotifications,
    usePrimaryRecoverySecret,
    useUserKeys,
} from '../../hooks';
import Button, { ButtonProps } from '../../components/button/Button';

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
            await exportRecoveryFile({ recoverySecret, userKeys });
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

        await exportRecoveryFile({ recoverySecret: primaryRecoverySecret.RecoverySecret, userKeys });
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
