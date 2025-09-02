import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Icon, Info, RadioGroup } from '@proton/components';
import automaticThemeImg from '@proton/pass/assets/settings/theme-automatic.svg';
import darkThemeImg from '@proton/pass/assets/settings/theme-dark.svg';
import lightThemeImg from '@proton/pass/assets/settings/theme-light.svg';
import { usePassTheme } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import type { PassThemeCardProps } from '@proton/pass/components/Settings/PassThemeCard';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

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
                                <Icon name="checkmark-circle-filled" size={6} color="var(--interaction-norm)" />
                            )}
                        </div>
                    ),
                }))}
            />
        </div>
    );
};
