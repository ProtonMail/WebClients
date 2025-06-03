import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectTheme } from '@proton/pass/store/selectors';

/** This component is used to sync the theme between different
 * app contexts connected to the redux store. The effect should
 * only be triggered after boot to avoid mutating the theme.  */
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
