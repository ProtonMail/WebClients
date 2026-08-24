import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import Info from '@proton/components/components/link/Info';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import automaticThemeImg from '../../assets/settings/theme-automatic.svg';
import darkThemeImg from '../../assets/settings/theme-dark.svg';
import lightThemeImg from '../../assets/settings/theme-light.svg';
import { settingsEditIntent } from '../../store/actions';
import { selectTheme } from '../../store/selectors';
import { usePassTheme } from '../Layout/Theme/ThemeProvider';
import { PassThemeOption } from '../Layout/Theme/types';
import type { PassThemeCardProps } from '../Settings/PassThemeCard';

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

export const OnboardingThemeSelect: FC = () => {
    const theme = usePassTheme();
    const dispatch = useDispatch();

    const currentTheme = useSelector(selectTheme) ?? theme;
    const onChange = (theme: PassThemeOption) => dispatch(settingsEditIntent('theme', { theme }, true));

    return (
        <div className="pass-onboarding-modal--theme">
            <RadioGroup<PassThemeOption>
                name="theme"
                onChange={onChange}
                value={currentTheme}
                className="pass-onboarding-modal--radio w-full"
                options={getThemeCards().map(({ label, theme, src, info }) => ({
                    value: theme,
                    label: (
                        <div className="pass-onboarding-modal--option rounded-xl flex items-center w-full py-3 px-4">
                            <img src={src} alt="" width={134} height={91} />
                            <div
                                className={clsx(
                                    'flex-1 px-4 flex items-center flex-nowrap gap-1',
                                    theme === currentTheme && 'text-bold'
                                )}
                            >
                                {label}
                                {info}
                            </div>
                            {theme === currentTheme && (
                                <IcCheckmarkCircleFilled size={6} color="var(--interaction-norm)" />
                            )}
                        </div>
                    ),
                }))}
            />
        </div>
    );
};
