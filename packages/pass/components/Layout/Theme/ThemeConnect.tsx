import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectTheme } from '@proton/pass/store/selectors';

export const ThemeConnect = () => {
    const { setTheme } = usePassCore();
    const selectedTheme = useSelector(selectTheme);

    useEffect(() => {
        if (selectedTheme) setTheme?.(selectedTheme);
    }, [selectedTheme]);

    return null;
};
