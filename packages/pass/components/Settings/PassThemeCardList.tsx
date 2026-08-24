import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import automaticThemeImg from '../../assets/settings/theme-automatic.svg';
import darkThemeImg from '../../assets/settings/theme-dark.svg';
import lightThemeImg from '../../assets/settings/theme-light.svg';
import { settingsEditIntent } from '../../store/actions';
import { selectTheme } from '../../store/selectors';
import { usePassTheme } from '../Layout/Theme/ThemeProvider';
import { PassThemeOption } from '../Layout/Theme/types';
import type { PassThemeCardProps } from './PassThemeCard';
import { PassThemeCard } from './PassThemeCard';

const getThemeCards = (): PassThemeCardProps[] => [
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
];

export const PassThemeCardList: FC = () => {
    const currentTheme = usePassTheme();
    const theme = useSelector(selectTheme) ?? currentTheme;

    const dispatch = useDispatch();
    const onChange = (theme: PassThemeOption) => dispatch(settingsEditIntent('theme', { theme }, true));

    return (
        <div className="flex gap-4">
            {getThemeCards().map((cardProps) => (
                <PassThemeCard
                    key={cardProps.theme}
                    selected={theme === cardProps.theme}
                    onChange={onChange}
                    {...cardProps}
                />
            ))}
        </div>
    );
};
