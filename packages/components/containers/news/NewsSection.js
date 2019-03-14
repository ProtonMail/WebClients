import React from 'react';
import { c } from 'ttag';
import { Label, Checkbox, useApiWithoutResult, useSettings, useEventManager } from 'react-components';
import { updateNews } from 'proton-shared/lib/api/settings';
import { toBitMap } from 'proton-shared/lib/helpers/object';

import useNews from './useNews';

const NewsSection = () => {
    const { News } = useSettings();
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateNews);
    const keys = ['announcements', 'features', 'newsletter', 'beta'];
    const { news, setNews } = useNews(News, keys);

    const handleChange = (key) => async (event) => {
        // Here we need to keep the order of the Object for the bitmap conversion
        // so we cannot do: { ...new, [key]: event.target.checked }
        const newState = Object.keys(news).reduce((acc, k) => {
            acc[k] = k === key ? event.target.checked : acc[k];
            return acc;
        }, {});
        const value = toBitMap(newState);
        await request(value);
        await call();
        setNews(value);
    };

    return (
        <>
            <Label htmlFor="announcements">
                <Checkbox
                    id="announcements"
                    checked={news.announcements}
                    disabled={loading}
                    onChange={handleChange('announcements')}
                />
                {c('Label for news').t`Major announcements (2-3 per year)`}
            </Label>
            <Label htmlFor="features">
                <Checkbox
                    id="features"
                    checked={news.features}
                    disabled={loading}
                    onChange={handleChange('features')}
                />
                {c('Label for news').t`Major features (3-4 per year)`}
            </Label>
            <Label htmlFor="newsletter">
                <Checkbox
                    id="newsletter"
                    checked={news.newsletter}
                    disabled={loading}
                    onChange={handleChange('newsletter')}
                />
                {c('Label for news').t`Proton newsletter (5-6 per year)`}
            </Label>
            <Label htmlFor="beta">
                <Checkbox id="beta" checked={news.beta} disabled={loading} onChange={handleChange('beta')} />
                {c('Label for news').t`Proton Beta (10-12 per year)`}
            </Label>
        </>
    );
};

export default NewsSection;
