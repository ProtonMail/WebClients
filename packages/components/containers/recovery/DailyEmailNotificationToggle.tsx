import { c } from 'ttag';
import { updateNotifyEmail } from '@proton/shared/lib/api/settings';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { useLoading, useNotifications, useUserSettings, useApi, useEventManager } from '../../hooks';
import { Toggle, Info } from '../../components';

export const DailyEmailNotificationToggleInput = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [isNotifyEmailApiCallLoading, withLoading] = useLoading();
    const [userSettings, isUserSettingsLoading] = useUserSettings();

    const handleChangeEmailNotify = async (value: number) => {
        if (value && !userSettings.Email.Value) {
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
            loading={isNotifyEmailApiCallLoading || isUserSettingsLoading}
            checked={!!userSettings.Email.Notify && !!userSettings.Email.Value}
            id="dailyNotificationsToggle"
            onChange={({ target: { checked } }) => withLoading(handleChangeEmailNotify(+checked))}
        />
    );
};

export const DailyEmailNotificationToggleLabel = () => (
    <label htmlFor="dailyNotificationsToggle" className="flex-item-fluid">
        <span className="pr0-5 text-semibold">{c('Label').t`Daily email notifications`}</span>
        <Info
            url="https://protonmail.com/blog/notification-emails/"
            title={c('Info')
                .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ${MAIL_APP_NAME} account.`}
        />
    </label>
);
