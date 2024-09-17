import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';
import { type ThemeTypes, getPassThemes } from '@proton/shared/lib/themes/themes';

const getThemes = () => [
    ...getPassThemes(),
    {
        identifier: PassThemeOption.OS,
        label: c('Option').t`System theme`,
    },
];

const getTranslatedLabel = (identifier: PassThemeOption | ThemeTypes) => {
    switch (identifier) {
        case PassThemeOption.PassDark:
            return c('Option').t`Dark theme`;
        case PassThemeOption.PassLight:
            return c('Option').t`Light theme`;
        default:
            return undefined;
    }
};

type Props = { className?: string };
export const ThemeSelector: FC<Props> = ({ className }) => {
    const dispatch = useDispatch();
    const theme = useSelector(selectTheme) ?? PASS_DEFAULT_THEME;
    const themes = getThemes();

    return (
        <SelectTwo<PassThemeOption>
            placeholder={c('Label').t`Select preferred theme`}
            onValue={(theme) => dispatch(settingsEditIntent('theme', { theme }, true))}
            value={theme}
            className={className}
        >
            {themes.map(({ identifier, label }) => (
                <Option key={identifier} title={getTranslatedLabel(identifier) ?? label} value={identifier} />
            ))}
        </SelectTwo>
    );
};
