import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/docs/user';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/docs/userSettings';

import useApi from '../useApi';
import useNotifications from '../useNotifications';

export const useDocsEmailTitleEnabledSetting = () => {
    const api = useApi();
    const [isLoading, withLoading] = useLoading();
    const [isSubmitting, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [emailTitleEnabled, setEmailTitleEnabled] = useState<boolean>(true);

    useEffect(() => {
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings, Defaults }) => {
                setEmailTitleEnabled(
                    UserSettings.DocsCommentsNotificationsIncludeDocumentName ||
                        Defaults.DocsCommentsNotificationsIncludeDocumentName
                );
            })
        );
    }, []);

    const handleChange = (value: boolean) => {
        return withSubmitLoading(
            api<UserSettingsResponse>(
                queryUpdateUserSettings({
                    DocsCommentsNotificationsIncludeDocumentName: value,
                })
            )
        )
            .then(() => {
                createNotification({
                    text: c('Info').t`Settings updated`,
                });
                setEmailTitleEnabled(value);
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
        emailTitleEnabled,
        isLoading,
        isSubmitting,
        handleChange,
    };
};
