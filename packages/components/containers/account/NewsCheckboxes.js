import React from 'react';
import { c } from 'ttag';
import { NEWS } from 'proton-shared/lib/constants';
import { updateNews } from 'proton-shared/lib/api/settings';
import { toggleBit, hasBit } from 'proton-shared/lib/helpers/bitset';

import { Checkbox } from '../../components';
import { useUserSettings, useEventManager, useNotifications, useApi, useLoading } from '../../hooks';

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

    const checkboxes = [
        {
            id: 'announcements',
            flag: ANNOUNCEMENTS,
            text: c('Label for news').t`Proton announcements (2-3 emails per year)`,
        },
        { id: 'features', flag: FEATURES, text: c('Label for news').t`Proton major features (3-4 emails per year)` },
        { id: 'business', flag: BUSINESS, text: c('Label for news').t`Proton for business (4-5 emails per year)` },
        { id: 'newsletter', flag: NEWSLETTER, text: c('Label for news').t`Proton newsletter (8-10 emails per year)` },
        { id: 'beta', flag: BETA, text: c('Label for news').t`Proton Beta (10-12 emails per year)` },
    ];

    return (
        <ul className="unstyled">
            {checkboxes.map(({ id, flag, text }) => {
                return (
                    <li key={id} className="mb0-5">
                        <Checkbox checked={hasBit(News, flag)} disabled={loading} onChange={handleChange(flag)}>
                            {text}
                        </Checkbox>
                    </li>
                );
            })}
        </ul>
    );
};

export default NewsCheckboxes;
