import React from 'react';
import { c } from 'ttag';
import {
    Label,
    Checkbox,
    useUserSettings,
    useEventManager,
    useNotifications,
    useApi,
    useLoading
} from 'react-components';
import { NEWS } from 'proton-shared/lib/constants';
import { updateNews } from 'proton-shared/lib/api/settings';
import { toggleBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { ANNOUNCEMENTS, FEATURES, NEWSLETTER, BETA, BUSINESS } = NEWS;

const NewsCheckboxes = () => {
    const [{ News } = {}] = useUserSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const update = async (mask) => {
        await api(updateNews(toggleBit(News, mask)));
        await call();
        createNotification({ text: c('Info').t`Emailing preference updated` });
    };

    const handleChange = (mask) => () => withLoading(update(mask));

    return (
        <ul className="unstyled">
            <li>
                <Label htmlFor="announcements">
                    <Checkbox
                        id="announcements"
                        checked={hasBit(News, ANNOUNCEMENTS)}
                        disabled={loading}
                        onChange={handleChange(ANNOUNCEMENTS)}
                    />
                    {c('Label for news').t`Major announcements (2-3 per year)`}
                </Label>
            </li>
            <li>
                <Label htmlFor="features">
                    <Checkbox
                        id="features"
                        checked={hasBit(News, FEATURES)}
                        disabled={loading}
                        onChange={handleChange(FEATURES)}
                    />
                    {c('Label for news').t`Major features (3-4 per year)`}
                </Label>
            </li>
            <li>
                <Label htmlFor="business">
                    <Checkbox
                        id="business"
                        checked={hasBit(News, BUSINESS)}
                        disabled={loading}
                        onChange={handleChange(BUSINESS)}
                    />
                    {c('Label for news').t`Proton business (4-5 per year)`}
                </Label>
            </li>
            <li>
                <Label htmlFor="newsletter">
                    <Checkbox
                        id="newsletter"
                        checked={hasBit(News, NEWSLETTER)}
                        disabled={loading}
                        onChange={handleChange(NEWSLETTER)}
                    />
                    {c('Label for news').t`Proton newsletter (5-6 per year)`}
                </Label>
            </li>
            <li>
                <Label htmlFor="beta">
                    <Checkbox id="beta" checked={hasBit(News, BETA)} disabled={loading} onChange={handleChange(BETA)} />
                    {c('Label for news').t`Proton Beta (10-12 per year)`}
                </Label>
            </li>
        </ul>
    );
};

export default NewsCheckboxes;
