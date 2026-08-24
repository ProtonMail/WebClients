import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectTheme } from '../../../store/selectors';
import { usePassCore } from '../../Core/PassCoreProvider';

export const ThemeConnect = () => {
    const core = usePassCore();
    const selectedTheme = useSelector(selectTheme);
    const didBoot = useRef(false);

    useEffect(() => {
        if (!didBoot.current) didBoot.current = true;
        else core.theme.sync();
    }, [selectedTheme]);

    return null;
};
