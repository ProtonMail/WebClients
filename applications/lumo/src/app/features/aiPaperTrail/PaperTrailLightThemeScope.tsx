import { type PropsWithChildren, useMemo } from 'react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { getThemeConfig } from '../../providers/lumoThemeUtils';

const PAPER_TRAIL_LIGHT_THEME_ID = 'lumo-paper-trail-light-theme';

const getScopedLightThemeStyles = (): string => {
    const lightThemeStyles = getThemeConfig(ThemeTypes.LumoLight).styles;
    return lightThemeStyles.replace(/:root,\s*\n\.ui-standard/g, '.ai-paper-trail');
};

/**
 * Paper trail is a marketing surface that always uses the light palette, even
 * when the user prefers dark mode elsewhere in Lumo.
 */
export const PaperTrailLightThemeScope = ({ children }: PropsWithChildren) => {
    const scopedLightThemeStyles = useMemo(() => getScopedLightThemeStyles(), []);

    return (
        <>
            <style id={PAPER_TRAIL_LIGHT_THEME_ID}>{scopedLightThemeStyles}</style>
            {children}
        </>
    );
};
