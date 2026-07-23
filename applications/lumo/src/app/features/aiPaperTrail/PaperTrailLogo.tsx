import { useMemo } from 'react';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { LOGO_HEIGHT, getLogoSrc } from '../../components/LumoLogoWithTierTag/LumoLogoWithTierTag';
import { useLumoTheme } from '../../providers/LumoThemeProvider';

/**
 * Paper trail pages always render on a light background. Dark-mode users still
 * get the dark-mode logo variant everywhere else in Lumo, but here we use the
 * light-background logo so the wordmark stays readable.
 */
const getPaperTrailLogoSrc = (userTheme: ThemeTypes): string => {
    void userTheme;
    return getLogoSrc(ThemeTypes.LumoLight);
};

interface PaperTrailLogoProps {
    height?: string;
    className?: string;
    alt?: string;
}

export const PaperTrailLogo = ({
    height = LOGO_HEIGHT,
    className,
    alt = LUMO_SHORT_APP_NAME,
}: PaperTrailLogoProps) => {
    const { theme } = useLumoTheme();
    const logoSrc = useMemo(() => getPaperTrailLogoSrc(theme), [theme]);

    return <img src={logoSrc} alt={alt} height={height} className={className} />;
};
