import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useLumoTheme } from '../../../providers/LumoThemeProvider';

const LUMO_AUTO_THEME = 'auto' as const;

const LumoThemeButton = () => {
    const { theme, setTheme, setAutoTheme, isAutoMode } = useLumoTheme();

    const handleValueChange = (value: string | ThemeTypes) => {
        if (value === LUMO_AUTO_THEME) {
            setAutoTheme(true);
        } else {
            setTheme(value as ThemeTypes);
        }
    };

    const currentValue = isAutoMode ? LUMO_AUTO_THEME : theme;

    return (
        <SelectTwo value={currentValue} onValue={handleValueChange} className="theme-dropdown">
            <Option value={LUMO_AUTO_THEME} title={c('collider_2025: Action').t`System`} />
            <Option value={ThemeTypes.LumoLight} title={c('collider_2025: Action').t`Light`} />
            <Option value={ThemeTypes.LumoDark} title={c('collider_2025: Action').t`Dark`} />
        </SelectTwo>
    );
};

export default LumoThemeButton;
