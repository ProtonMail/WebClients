import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';
import { type ThemeTypes, getPassThemes } from '@proton/shared/lib/themes/themes';

import { SettingsPanel } from './SettingsPanel';

const themes = getPassThemes();

export const Theme: FC = () => {
    const dispatch = useDispatch();
    const theme = useSelector(selectTheme) ?? PASS_DEFAULT_THEME;

    return (
        <SettingsPanel title={c('Label').t`Theme`}>
            <SelectTwo<ThemeTypes>
                placeholder={c('Label').t`Select preferred theme`}
                onValue={(theme) => dispatch(settingsEditIntent('theme', { theme }, true))}
                value={theme}
            >
                {themes.map(({ identifier, label }) => (
                    <Option key={identifier} title={label} value={identifier} />
                ))}
            </SelectTwo>
        </SettingsPanel>
    );
};
