import { useState } from 'react';

import { userSettingsActions } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import {
    type EmailSubscription,
    filterNews,
    getEmailSubscriptions,
    getUpdateNotification,
} from '@proton/components/containers/account/constants/email-subscriptions';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store';
import { patchNews } from '@proton/shared/lib/api/settings';
import { type NewsletterSubscriptionUpdateData, getUpdatedNewsBitmap } from '@proton/shared/lib/helpers/newsletter';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { useNotifications, useUserSettings } from '../../hooks';
import { EmailSubscriptionToggleWithHeader } from './EmailSubscriptionToggles';

const EditEmailSubscription = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

    const run = async (data: NewsletterSubscriptionUpdateData) => {
        dispatch(userSettingsActions.update({ UserSettings: { News: getUpdatedNewsBitmap(userSettings.News, data) } }));
        await api<{ UserSettings: UserSettings }>(patchNews(data));
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
        run(data).finally(() => {
            setLoadingMapDiff(data, false);
        });
    };

    const filter = (emailSubscription: EmailSubscription) =>
        filterNews({
            emailSubscription,
            user,
            userSettings,
        });

    const { general, product, notifications } = getEmailSubscriptions(filter);

    const sharedProps = {
        onChange: handleChange,
        loadingMap,
        News: userSettings.News,
    };

    return (
        <div className="flex flex-column gap-4">
            <EmailSubscriptionToggleWithHeader title={general.title} subscriptions={general.toggles} {...sharedProps} />
            <EmailSubscriptionToggleWithHeader title={product.title} subscriptions={product.toggles} {...sharedProps} />
            <EmailSubscriptionToggleWithHeader
                title={notifications.title}
                subscriptions={notifications.toggles}
                {...sharedProps}
            />
        </div>
    );
};

export default EditEmailSubscription;
