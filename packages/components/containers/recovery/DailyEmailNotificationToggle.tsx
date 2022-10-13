import { c } from 'ttag';

import { updateNotifyEmail } from '@proton/shared/lib/api/settings';

import { Toggle } from '../../components';
import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';

interface DailyEmailNotificationToggleProps {
    id: string;
    isEnabled: boolean;
    canEnable: boolean;
    className?: string;
}

const DailyEmailNotificationToggle = ({ id, isEnabled, canEnable, className }: DailyEmailNotificationToggleProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [isNotifyEmailApiCallLoading, withLoading] = useLoading();

    const handleChangeEmailNotify = async (value: number) => {
        if (value && !canEnable) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
        }
        await api(updateNotifyEmail(value));
        await call();
    };

    return (
        <Toggle
            className={className}
            loading={isNotifyEmailApiCallLoading}
            checked={isEnabled}
            id={id}
            onChange={({ target: { checked } }) => withLoading(handleChangeEmailNotify(+checked))}
        />
    );
};

export default DailyEmailNotificationToggle;
