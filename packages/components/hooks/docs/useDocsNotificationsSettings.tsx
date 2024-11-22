import { useState } from 'react';

import { c } from 'ttag';

import { useEffectOnce, useLoading } from '@proton/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/docs/user';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/docs/userSettings';

import useApi from '../useApi';
import useNotifications from '../useNotifications';

export const useDocsNotificationsSettings = () => {
    const api = useApi();
    const [isReady, setIsReady] = useState(false);
    const [isLoading, withLoading] = useLoading();
    const [isSubmitting, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean | null>(null);
    const [emailTitleEnabled, setEmailTitleEnabled] = useState<boolean | null>(null);

    useEffectOnce(() => {
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings }) => {
                setEmailNotificationsEnabled(UserSettings.DocsCommentsNotificationsEnabled);
                setEmailTitleEnabled(UserSettings.DocsCommentsNotificationsIncludeDocumentName);
                setIsReady(true);
            })
        );
    });

    const updateNotificationSettings = ({
        notificationsEnabled,
        includeTitleEnabled,
    }: {
        notificationsEnabled: boolean;
        includeTitleEnabled: boolean;
    }) => {
        return withSubmitLoading(
            api<UserSettingsResponse>(
                queryUpdateUserSettings({
                    DocsCommentsNotificationsEnabled: notificationsEnabled,
                    DocsCommentsNotificationsIncludeDocumentName: includeTitleEnabled,
                })
            )
        )
            .then(() => {
                createNotification({
                    text: c('Info').t`Settings updated`,
                });
                setEmailNotificationsEnabled(notificationsEnabled);
                setEmailTitleEnabled(includeTitleEnabled);
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

    const changeEmailNotificationsEnabledValue = (value: boolean) => {
        return updateNotificationSettings({
            notificationsEnabled: value,
            includeTitleEnabled: emailTitleEnabled ?? false,
        });
    };

    const changeDocumentTitleEnabledValue = (value: boolean) => {
        return updateNotificationSettings({
            notificationsEnabled: emailNotificationsEnabled ?? false,
            includeTitleEnabled: value,
        });
    };

    return {
        emailNotificationsEnabled,
        emailTitleEnabled,
        isLoading,
        isSubmitting,
        isReady,
        changeEmailNotificationsEnabledValue,
        changeDocumentTitleEnabledValue,
        updateNotificationSettings,
    };
};
