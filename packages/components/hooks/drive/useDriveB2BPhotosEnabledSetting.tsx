import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/user';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';

import useApi from '../useApi';
import useNotifications from '../useNotifications';

export const useDriveB2BPhotosEnabledSetting = () => {
    const api = useApi();
    const [isLoading, withLoading] = useLoading();
    const [isSubmitting, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [b2bPhotosEnabled, setB2bPhotosEnabled] = useState<boolean>(false);

    useEffect(() => {
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings, Defaults }) => {
                setB2bPhotosEnabled(UserSettings.B2BPhotosEnabled || Defaults.B2BPhotosEnabled);
            })
        );
    }, []);

    const handleChange = (value: boolean) => {
        return withSubmitLoading(
            api<UserSettingsResponse>(
                queryUpdateUserSettings({
                    B2BPhotosEnabled: value,
                })
            )
        )
            .then(() => {
                createNotification({
                    text: c('Info').t`Settings updated`,
                });
                setB2bPhotosEnabled(value);
            })
            .catch((err) => {
                createNotification({
                    type: 'error',
                    text: c('Info').t`Settings update failed`,
                });
                console.error('Settings update failed.', err);
            });
    };

    return {
        b2bPhotosEnabled,
        isLoading,
        isSubmitting,
        handleChange,
    };
};
