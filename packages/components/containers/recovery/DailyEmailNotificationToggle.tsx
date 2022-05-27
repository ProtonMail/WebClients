import { c } from 'ttag';
import { updateNotifyEmail } from '@proton/shared/lib/api/settings';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { useLoading, useNotifications, useApi, useEventManager } from '../../hooks';
import { Toggle, Info } from '../../components';

interface DailyEmailNotificationToggleInputProps {
    isEnabled: boolean;
    canEnable: boolean;
}

export const DailyEmailNotificationToggleInput = ({ isEnabled, canEnable }: DailyEmailNotificationToggleInputProps) => {
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
            className="mr0-5"
            loading={isNotifyEmailApiCallLoading}
            checked={isEnabled}
            id="dailyNotificationsToggle"
            onChange={({ target: { checked } }) => withLoading(handleChangeEmailNotify(+checked))}
        />
    );
};

export const DailyEmailNotificationToggleLabel = () => (
    <label htmlFor="dailyNotificationsToggle" className="flex-item-fluid">
        <span className="pr0-5 text-semibold">{c('Label').t`Daily email notifications`}</span>
        <Info
            url={getStaticURL('/support/notification-email')}
            title={c('Info')
                .t`When notifications are enabled, we'll send an alert to your recovery email address if you have new messages in your ${MAIL_APP_NAME} account.`}
        />
    </label>
);
