import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import useDownloadRecoveryFile from '@proton/components/hooks/recoveryFile/useDownloadRecoveryFile';
import { useLoading } from '@proton/hooks';

import { useNotifications } from '../../hooks';

interface Props extends Omit<ButtonProps, 'onClick'> {}

const ExportRecoveryFileButton = ({ children = c('Action').t`Download recovery file`, ...rest }: Props) => {
    const downloadRecoveryFile = useDownloadRecoveryFile();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const handleClick = async () => {
        try {
            await downloadRecoveryFile();
            createNotification({ text: c('Info').t`Recovery file downloaded` });
        } catch (error) {
            createNotification({
                text: c('Info').t`Unable to verify recovery file signature. Please contact support.`,
                type: 'error',
            });
        }
    };

    return (
        <Button onClick={() => withLoading(handleClick())} loading={loading} {...rest}>
            {children}
        </Button>
    );
};

export default ExportRecoveryFileButton;
