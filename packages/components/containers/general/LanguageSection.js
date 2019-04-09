import React, { useState } from 'react';
import { c, useLocale as setTtagLocale } from 'ttag';
import { SubTitle, Row, Label, Select, useUserSettings, useApiWithoutResult, useNotifications } from 'react-components';
import { updateLocale } from 'proton-shared/lib/api/settings';

const LanguageSection = () => {
    const [{ Locale }] = useUserSettings();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateLocale);
    const [locale, setLocale] = useState(Locale);
    const options = [
        { text: 'Čeština', value: 'cs_CZ' },
        { text: 'Deutsch', value: 'de_DE' },
        { text: 'English', value: 'en_US' },
        { text: 'Español', value: 'es_ES' },
        { text: 'Français', value: 'fr_FR' },
        // { text: 'Bahasa Indonesia', value: 'id_ID' },
        { text: 'Hrvatski', value: 'hr_HR' },
        { text: 'Italiano', value: 'it_IT' },
        { text: '日本語', value: 'ja_JP' },
        { text: 'Nederlands', value: 'nl_NL' },
        { text: 'Polski', value: 'pl_PL' },
        { text: 'Português, brasileiro', value: 'pt_BR' },
        { text: 'Pусский', value: 'ru_RU' },
        { text: 'Română', value: 'ro_RO' },
        { text: 'Türkçe', value: 'tr_TR' },
        { text: 'Українська', value: 'uk_UA' },
        { text: '简体中文', value: 'zh_CN' },
        { text: '繁體中文', value: 'zh_TW' }
    ];
    const handleChange = async ({ target }) => {
        const newLocale = target.value;
        await request(newLocale);
        setLocale(newLocale);
        setTtagLocale(newLocale);
        createNotification({ text: c('Success').t`Locale updated` });
    };
    return (
        <>
            <SubTitle>{c('Title').t`Language`}</SubTitle>
            <Row>
                <Label htmlFor="languageSelect">{c('Label').t`Default language`}</Label>
                <Select
                    disabled={loading}
                    value={locale}
                    id="languageSelect"
                    options={options}
                    onChange={handleChange}
                />
            </Row>
        </>
    );
};

export default LanguageSection;
