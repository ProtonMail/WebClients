import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { updateLocale } from 'proton-shared/lib/api/settings';
import { loadLocale, loadDateLocale } from 'proton-shared/lib/i18n/loadLocale';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import {
    useApi,
    useConfig,
    useLoading,
    useNotifications,
    useForceRefresh,
    useEventManager,
    useUserSettings,
} from '../../hooks';
import { Row, Field, Label, Select } from '../../components';

interface Props {
    locales: TtagLocaleMap;
}

const LanguageSection = ({ locales = {} }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { LOCALES = {} } = useConfig();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const forceRefresh = useForceRefresh();

    const options = Object.keys(LOCALES).map((value) => ({
        text: LOCALES[value],
        value,
    }));

    const handleChange = async ({ target }: ChangeEvent<HTMLSelectElement>) => {
        const newLocale = target.value;
        await api(updateLocale(newLocale));
        const localeCode = getClosestLocaleCode(newLocale, locales);
        await Promise.all([
            loadLocale(localeCode, locales),
            loadDateLocale(localeCode, getBrowserLocale(), userSettings),
        ]);
        await call();
        createNotification({ text: c('Success').t`Locale updated` });
        forceRefresh();
    };

    const displayedValue = getClosestLocaleCode(userSettings?.Locale, locales);

    return (
        <Row>
            <Label htmlFor="languageSelect">{c('Label').t`Default language`}</Label>
            <Field>
                <Select
                    disabled={loading}
                    value={displayedValue}
                    id="languageSelect"
                    options={options}
                    onChange={(e) => {
                        withLoading(handleChange(e));
                    }}
                />
            </Field>
        </Row>
    );
};

export default LanguageSection;
