import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useLumoTheme } from '../../../providers/LumoThemeProvider';

const LumoThemeButton = () => {
    const { theme, setTheme } = useLumoTheme();

    return (
        <SelectTwo value={theme} onValue={setTheme} className="theme-dropdown">
            <Option value={ThemeTypes.LumoLight} title={c('collider_2025: Action').t`Light`} />
            <Option value={ThemeTypes.LumoDark} title={c('collider_2025: Action').t`Dark`} />
        </SelectTwo>
    );
};

export default LumoThemeButton;
