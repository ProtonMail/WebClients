import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Row,
    Field,
    Label,
    Select,
    useApiWithoutResult,
    useEventManager,
    useConfig,
    useLocale
} from 'react-components';
import { updateLocale } from 'proton-shared/lib/api/settings';

function LanguageSection() {
    const config = useConfig();
    const locale = useLocale();
    const { request, loading } = useApiWithoutResult(updateLocale);
    const { call } = useEventManager();

    const LANG = {
        cs_CZ: 'Čeština',
        de_DE: 'Deutsch',
        en_US: 'English',
        es_ES: 'Español',
        ca_ES: 'Español - català',
        fr_FR: 'Français',
        hr_HR: 'Hrvatski',
        it_IT: 'Italiano',
        ja_JP: '日本語',
        nl_NL: 'Nederlands',
        pl_PL: 'Polski',
        pt_BR: 'Português, brasileiro',
        ru_RU: 'Pусский',
        ro_RO: 'Română',
        tr_TR: 'Türkçe',
        uk_UA: 'Українська',
        zh_CN: '简体中文',
        zh_TW: '繁體中'
    };

    const options = ['en_US'].concat(config.TRANSLATIONS).map((value) => ({
        text: LANG[value],
        value
    }));

    const handleChange = async ({ target }) => {
        const newLocale = target.value;
        await request(newLocale);
        await call(); // Then we sync the locale via LocaleProvider
    };

    return (
        <>
            <SubTitle>{c('Title').t`Language`}</SubTitle>
            <Row>
                <Label htmlFor="languageSelect">
                    {c('Label').t`Default language`} <kbd>{locale}</kbd>
                </Label>
                <Field>
                    <Select
                        disabled={loading}
                        value={locale}
                        id="languageSelect"
                        options={options}
                        onChange={handleChange}
                    />
                </Field>
            </Row>
        </>
    );
}

export default LanguageSection;
