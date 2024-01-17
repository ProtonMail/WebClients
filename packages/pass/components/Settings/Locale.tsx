import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { LocaleSelect } from '@proton/pass/components/Form/legacy/LocaleSelect';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectLocale } from '@proton/pass/store/selectors';

import { SettingsPanel } from './SettingsPanel';

export const Locale: FC = () => {
    const locale = useSelector(selectLocale);
    const dispatch = useDispatch();

    const getLocaleFromDocumentLang = (lang: string) => lang.replace(/-/g, '_').replace('es', 'es_LA');
    const currentPageLocale = getLocaleFromDocumentLang(document.documentElement.lang);

    return (
        <SettingsPanel title={c('Label').t`Language`}>
            <LocaleSelect
                value={locale ?? currentPageLocale}
                onChange={(locale) => dispatch(settingsEditIntent('locale', { locale }))}
            />
        </SettingsPanel>
    );
};
