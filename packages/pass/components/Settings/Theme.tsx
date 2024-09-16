import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import { PassThemeOptions } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';
import { getPassThemes } from '@proton/shared/lib/themes/themes';

import { SettingsPanel } from './SettingsPanel';

const themes = [
    ...getPassThemes(),
    {
        identifier: PassThemeOptions.OS,
        label: c('Option').t`System theme`,
    },
];

export const Theme: FC = () => {
    const dispatch = useDispatch();
    const theme = useSelector(selectTheme) ?? PASS_DEFAULT_THEME;

    return (
        <SettingsPanel title={c('Label').t`Theme`}>
            <SelectTwo<PassThemeOptions>
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
