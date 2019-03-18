import React, { useState } from 'react';
import { c } from 'ttag';
import { Label, Checkbox, useApiWithoutResult, useSettings, useEventManager } from 'react-components';
import { NEWS } from 'proton-shared/lib/constants';
import { updateNews } from 'proton-shared/lib/api/settings';
import { toggleBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { ANNOUNCEMENTS, FEATURES, NEWSLETTER, BETA } = NEWS;

const NewsCheckboxes = () => {
    const { News } = useSettings();
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateNews);
    const [news, setNews] = useState(News);

    const handleChange = async (mask) => {
        const newNews = toggleBit(news, mask);

        setNews(newNews);
        await request(newNews);
        await call();
    };

    return (
        <>
            <Label htmlFor="announcements">
                <Checkbox
                    id="announcements"
                    checked={hasBit(news, ANNOUNCEMENTS)}
                    disabled={loading}
                    onChange={handleChange(ANNOUNCEMENTS)}
                />
                {c('Label for news').t`Major announcements (2-3 per year)`}
            </Label>
            <Label htmlFor="features">
                <Checkbox
                    id="features"
                    checked={hasBit(news, FEATURES)}
                    disabled={loading}
                    onChange={handleChange(FEATURES)}
                />
                {c('Label for news').t`Major features (3-4 per year)`}
            </Label>
            <Label htmlFor="newsletter">
                <Checkbox
                    id="newsletter"
                    checked={hasBit(news, NEWSLETTER)}
                    disabled={loading}
                    onChange={handleChange(NEWSLETTER)}
                />
                {c('Label for news').t`Proton newsletter (5-6 per year)`}
            </Label>
            <Label htmlFor="beta">
                <Checkbox id="beta" checked={hasBit(news, BETA)} disabled={loading} onChange={handleChange(BETA)} />
                {c('Label for news').t`Proton Beta (10-12 per year)`}
            </Label>
        </>
    );
};

export default NewsCheckboxes;
