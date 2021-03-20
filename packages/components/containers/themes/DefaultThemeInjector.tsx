import React, { useState } from 'react';
import { PROTON_THEMES } from 'proton-shared/lib/themes/themes';

const DefaultThemeInjector = () => {
    const [style] = useState(() => PROTON_THEMES.DEFAULT.theme);
    return <style>{style}</style>;
};

export default DefaultThemeInjector;
