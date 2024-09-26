import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import automaticThemeImg from '@proton/pass/assets/settings/theme-automatic.svg';
import darkThemeImg from '@proton/pass/assets/settings/theme-dark.svg';
import lightThemeImg from '@proton/pass/assets/settings/theme-light.svg';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PassThemeCard } from '@proton/pass/components/Settings/PassThemeCard';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';

const THEME_IMG_SRC_MAP = {
    [PassThemeOption.OS]: automaticThemeImg,
    [PassThemeOption.PassDark]: darkThemeImg,
    [PassThemeOption.PassLight]: lightThemeImg,
};

const getThemes = () => [
    {
        identifier: PassThemeOption.PassDark,
        label: c('Theme').t`Dark`,
    },
    {
        identifier: PassThemeOption.PassLight,
        label: c('Theme').t`Light`,
    },
    {
        identifier: PassThemeOption.OS,
        label: c('Theme').t`Automatic`,
    },
];

export const PassThemeCardList: FC = () => {
    const dispatch = useDispatch();
    const currentTheme = useSelector(selectTheme) ?? PASS_DEFAULT_THEME;
    const themes = getThemes();

    const onChange = (theme: PassThemeOption) => {
        dispatch(settingsEditIntent('theme', { theme }, true));
    };

    return (
        <div className="flex gap-4">
            {themes.map(({ identifier, label }) => (
                <PassThemeCard
                    key={identifier}
                    theme={identifier}
                    selected={currentTheme === identifier}
                    onChange={onChange}
                    imageSrc={THEME_IMG_SRC_MAP[identifier]}
                    label={label}
                />
            ))}
        </div>
    );
};
