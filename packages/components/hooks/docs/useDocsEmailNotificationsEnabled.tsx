import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/docs/user';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/docs/userSettings';

import useApi from '../useApi';
import useNotifications from '../useNotifications';

export const useDocsEmailNotificationsEnabled = () => {
    const api = useApi();
    const [isLoading, withLoading] = useLoading();
    const [isSubmitting, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(true);

    useEffect(() => {
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings, Defaults }) => {
                setEmailNotificationsEnabled(
                    UserSettings.DocsCommentsNotificationsEnabled || Defaults.DocsCommentsNotificationsEnabled
                );
            })
        );
    }, []);

    const handleChange = (value: boolean) => {
        return withSubmitLoading(
            api<UserSettingsResponse>(
                queryUpdateUserSettings({
                    DocsCommentsNotificationsEnabled: value,
                })
            )
        )
            .then(() => {
                createNotification({
                    text: c('Info').t`Settings updated`,
                });
                setEmailNotificationsEnabled(value);
            })
            .catch((err) => {
                createNotification({
                    type: 'error',
                    text: c('Info').t`Settings update failed`,
                });
                // eslint-disable-next-line no-console
                console.error('Settings update failed.', err);
            });
    };

    return {
        emailNotificationsEnabled,
        isLoading,
        isSubmitting,
        handleChange,
    };
};
