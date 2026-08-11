import type { LogoProps } from '../../logo/LogoBase';
import LumoLogo from '../../logo/LumoLogo';

/** The Lumo cat glyph, sized for the drawer sidebar button and the panel header. */
const LumoDrawerLogo = ({ size, className }: Pick<LogoProps, 'size' | 'className'>) => {
    return <LumoLogo variant="glyph-only" size={size} className={className} />;
};

export default LumoDrawerLogo;
