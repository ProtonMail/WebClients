import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { settingsEditIntent } from '../../store/actions/creators/settings';
import { selectLocale } from '../../store/selectors/settings';
import { LocaleSelect } from '../Form/legacy/LocaleSelect';
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
