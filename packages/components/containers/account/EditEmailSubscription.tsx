import { c } from 'ttag';
import { updateNews } from '@proton/shared/lib/api/settings';

import { useUserSettings, useEventManager, useNotifications, useApi, useLoading } from '../../hooks';
import EmailSubscriptionCheckboxes from './EmailSubscriptionCheckboxes';

const EditNews = () => {
    const [{ News } = { News: 0 }] = useUserSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const update = async (News: number) => {
        await api(updateNews(News));
        await call();
        createNotification({ text: c('Info').t`Emailing preference saved` });
    };

    const handleChange = (News: number) => withLoading(update(News));

    return <EmailSubscriptionCheckboxes News={News} onChange={handleChange} disabled={loading} />;
};

export default EditNews;
