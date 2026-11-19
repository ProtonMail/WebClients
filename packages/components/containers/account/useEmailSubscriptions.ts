import { useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { userSettingsActions, userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { patchNews } from '@proton/shared/lib/api/settings';
import { type NewsletterSubscriptionUpdateData, getUpdatedNewsBitmap } from '@proton/shared/lib/helpers/newsletter';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import noop from '@proton/utils/noop';

import {
    type EmailSubscription,
    filterNews,
    getEmailSubscriptions,
    getUpdateNotification,
} from './constants/email-subscriptions';

export const useEmailSubscriptions = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

    const run = async (data: NewsletterSubscriptionUpdateData) => {
        dispatch(userSettingsActions.update({ UserSettings: { News: getUpdatedNewsBitmap(userSettings.News, data) } }));
        try {
            await api<{ UserSettings: UserSettings }>(patchNews(data));
        } catch (error) {
            // The request can fail after the server saved the change, so show what the server has instead of guessing
            await dispatch(userSettingsThunk({ cache: CacheType.None })).catch(noop);
            throw error;
        }
        createNotification({ text: getUpdateNotification(data) });
    };

    const setLoadingMapDiff = (data: NewsletterSubscriptionUpdateData, value: boolean) => {
        setLoadingMap((oldValue) => ({
            ...oldValue,
            ...Object.fromEntries(Object.entries(data).map(([key]) => [key, value])),
        }));
    };

    const handleChange = async (data: NewsletterSubscriptionUpdateData) => {
        setLoadingMapDiff(data, true);
        run(data)
            .catch(noop)
            .finally(() => {
                setLoadingMapDiff(data, false);
            });
    };

    const filter = (emailSubscription: EmailSubscription) =>
        filterNews({
            emailSubscription,
            user,
            userSettings,
        });

    return {
        groups: getEmailSubscriptions(filter),
        onChange: handleChange,
        loadingMap,
        News: userSettings.News,
    };
};
