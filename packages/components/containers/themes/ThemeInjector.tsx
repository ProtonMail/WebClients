import React, { useState, useEffect } from 'react';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';

import { useUserSettings } from '../../hooks';

const getStyle = (themeType: ThemeTypes = ThemeTypes.Default) =>
    ({
        [ThemeTypes.Default]: PROTON_THEMES.DEFAULT.theme,
        [ThemeTypes.Dark]: PROTON_THEMES.DARK.theme,
        [ThemeTypes.Light]: PROTON_THEMES.LIGHT.theme,
        [ThemeTypes.Monokai]: PROTON_THEMES.MONOKAI.theme,
        [ThemeTypes.Contrast]: PROTON_THEMES.CONTRAST.theme,
    }[themeType]);

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const { ThemeType } = userSettings;
    const [style, setStyle] = useState(() => getStyle(ThemeType));

    useEffect(() => {
        setStyle(getStyle(ThemeType));
    }, [ThemeType]);

    // useLayoutEffect(() => {
    //     if (ThemeType === ThemeTypes.Dark) {
    //         document.body.classList.add(DARK_MODE_CLASS);
    //     } else {
    //         document.body.classList.remove(DARK_MODE_CLASS);
    //     }
    //     return () => {
    //         document.body.classList.remove(DARK_MODE_CLASS);
    //     };
    // }, [ThemeType]);

    return <style>{style}</style>;
};

export default ThemeInjector;
