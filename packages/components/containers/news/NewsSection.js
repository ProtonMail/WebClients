import React from 'react';
import { t } from 'ttag';
import { Label, Checkbox } from 'react-components';
import { updateNews } from 'proton-shared/lib/api/settings';
import { toBitMap } from 'proton-shared/lib/helpers/object';

import useApi from '../../hooks/useApi';
import useNews from './useNews';

const NewsSection = () => {
    const api = useApi();
    const keys = ['announcements', 'features', 'newsletter', 'beta'];
    const { news, setNews } = useNews(0, keys); // TODO get it from settings model

    const handleChange = (key) => async (event) => {
        // Here we need to keep the order of the Object for the bitmap conversion
        // so we cannot do: { ...new, [key]: event.target.checked }
        const newState = Object.keys(news).reduce((acc, k) => {
            acc[k] = k === key ? event.target.checked : acc[k];
            return acc;
        }, {});
        const value = toBitMap(newState);
        await api(updateNews(value));
        setNews(value);
    };

    return (
        <>
            <Label htmlFor="announcements">
                <Checkbox id="announcements" checked={news.announcements} onChange={handleChange('announcements')} />{' '}
                {t`Major announcements (2-3 per year)`}
            </Label>
            <Label htmlFor="features">
                <Checkbox id="features" checked={news.features} onChange={handleChange('features')} />{' '}
                {t`Major features (3-4 per year)`}
            </Label>
            <Label htmlFor="newsletter">
                <Checkbox id="newsletter" checked={news.newsletter} onChange={handleChange('newsletter')} />{' '}
                {t`Proton newsletter (5-6 per year)`}
            </Label>
            <Label htmlFor="beta">
                <Checkbox id="beta" checked={news.beta} onChange={handleChange('beta')} />{' '}
                {t`Proton Beta (10-12 per year)`}
            </Label>
        </>
    );
};

export default NewsSection;
