import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { LocaleSelect } from '@proton/pass/components/Form/legacy/LocaleSelect';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectLocale } from '@proton/pass/store/selectors';

import { SettingsPanel } from './SettingsPanel';

export const Locale: FC = () => {
    const locale = useSelector(selectLocale);
    const dispatch = useDispatch();

    return (
        <SettingsPanel title={c('Label').t`Language`}>
            <LocaleSelect
                value={locale}
                onChange={(locale) => dispatch(settingsEditIntent('locale', { locale }, true))}
            />
        </SettingsPanel>
    );
};
