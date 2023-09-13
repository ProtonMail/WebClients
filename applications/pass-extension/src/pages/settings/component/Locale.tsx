import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectLocale, settingEditIntent } from '@proton/pass/store';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';

import { LocaleSelect } from '../../../shared/components/fields/LocaleSelect';
import { SettingsPanel } from './SettingsPanel';

export const Locale: VFC = () => {
    const locale = useSelector(selectLocale);
    const dispatch = useDispatch();

    return (
        <SettingsPanel title={c('Label').t`Language`}>
            <LocaleSelect
                value={locale ?? DEFAULT_LOCALE}
                onChange={(locale) => dispatch(settingEditIntent('locale', { locale }))}
            />
        </SettingsPanel>
    );
};
