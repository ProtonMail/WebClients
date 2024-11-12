import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Info } from '@proton/components';
import automaticThemeImg from '@proton/pass/assets/settings/theme-automatic.svg';
import darkThemeImg from '@proton/pass/assets/settings/theme-dark.svg';
import lightThemeImg from '@proton/pass/assets/settings/theme-light.svg';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import type { PassThemeCardProps } from '@proton/pass/components/Settings/PassThemeCard';
import { PassThemeCard } from '@proton/pass/components/Settings/PassThemeCard';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const getThemeCards = (): PassThemeCardProps[] => [
    {
        theme: PassThemeOption.PassDark,
        label: c('Theme').t`Dark`,
        src: darkThemeImg,
    },
    {
        theme: PassThemeOption.PassLight,
        label: c('Theme').t`Light`,
        src: lightThemeImg,
    },
    {
        theme: PassThemeOption.OS,
        label: c('Theme').t`Automatic`,
        src: automaticThemeImg,
        info: (
            <Info
                className="color-weak"
                questionMark
                title={c('Info').t`${PASS_APP_NAME} will follow your system theme.`}
            />
        ),
    },
];

export const PassThemeCardList: FC = () => {
    const dispatch = useDispatch();
    const currentTheme = useSelector(selectTheme) ?? PASS_DEFAULT_THEME;
    const onChange = (theme: PassThemeOption) => dispatch(settingsEditIntent('theme', { theme }, true));

    return (
        <div className="flex gap-4">
            {getThemeCards().map((cardProps) => (
                <PassThemeCard
                    key={cardProps.theme}
                    selected={currentTheme === cardProps.theme}
                    onChange={onChange}
                    {...cardProps}
                />
            ))}
        </div>
    );
};
