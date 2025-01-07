import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectTheme } from '@proton/pass/store/selectors';

export const ThemeConnect = () => {
    const core = usePassCore();
    const selectedTheme = useSelector(selectTheme);

    useEffect(() => {
        if (selectedTheme) core.theme.setState(selectedTheme);
    }, [selectedTheme]);

    return null;
};
