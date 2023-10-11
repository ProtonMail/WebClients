import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectLocale } from '@proton/pass/store/selectors';
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
                onChange={(locale) => dispatch(settingsEditIntent('locale', { locale }))}
            />
        </SettingsPanel>
    );
};
