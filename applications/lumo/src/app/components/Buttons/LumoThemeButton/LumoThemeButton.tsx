import { c } from 'ttag';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import darkThemeImg from '@proton/styles/assets/img/lumo/lumo-theme-dark.svg';
import lightThemeImg from '@proton/styles/assets/img/lumo/lumo-theme-light.svg';
import systemThemeImg from '@proton/styles/assets/img/lumo/lumo-theme-system.svg';

import { useLumoTheme } from '../../../providers';
import type { LumoThemeCardProps } from './LumoThemeCard';
import LumoThemeCard from './LumoThemeCard';

import './LumoThemeButton.scss';

const LUMO_AUTO_THEME = 'auto' as const;

const getThemeCards = (): LumoThemeCardProps[] => [
    {
        value: ThemeTypes.LumoLight,
        label: c('collider_2025: Action').t`Light`,
        src: lightThemeImg,
    },
    {
        value: LUMO_AUTO_THEME,
        label: c('collider_2025: Action').t`System`,
        src: systemThemeImg,
    },
    {
        value: ThemeTypes.LumoDark,
        label: c('collider_2025: Action').t`Dark`,
        src: darkThemeImg,
    },
];

const LumoThemeButton = () => {
    const { theme, setTheme, setAutoTheme, isAutoMode } = useLumoTheme();

    const handleValueChange = (value: string | number) => {
        if (value === LUMO_AUTO_THEME) {
            setAutoTheme(true);
        } else {
            setTheme(value as ThemeTypes);
        }
    };

    const currentValue = isAutoMode ? LUMO_AUTO_THEME : theme;

    return (
        <div className="flex flex-row flex-nowrap gap-4">
            {getThemeCards().map((cardProps) => (
                <LumoThemeCard
                    key={cardProps.value}
                    selected={currentValue === cardProps.value}
                    onChange={handleValueChange}
                    {...cardProps}
                />
            ))}
        </div>
    );
};

export default LumoThemeButton;
