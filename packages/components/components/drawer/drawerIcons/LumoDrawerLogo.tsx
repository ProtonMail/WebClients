import { useState } from 'react';

import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

import LogoBase, { type LogoProps } from '../../logo/LogoBase';
import { LumoCatMark } from '../../logo/LumoLogo';

// The size lumo-cat-icon.svg rendered at in the drawer sidebar button
const GLYPH_SIZE = 26;
// Frames the cat with the same padding as lumo-cat-icon.svg
const GLYPH_VIEW_BOX = '-1.61 1.99 24.42 24.42';

/** The Lumo cat glyph, sized for the drawer sidebar button and the panel header. Inline, so it paints with the button. */
const LumoDrawerLogo = ({ size, className }: Pick<LogoProps, 'size' | 'className'>) => {
    const [uid] = useState(() => generateUID('lumo-drawer-logo'));

    return (
        <LogoBase
            uid={uid}
            logoWidth={GLYPH_SIZE}
            logoHeight={GLYPH_SIZE}
            viewBox={GLYPH_VIEW_BOX}
            title={LUMO_APP_NAME}
            variant="glyph-only"
            size={size}
            className={className}
        >
            <LumoCatMark />
        </LogoBase>
    );
};

export default LumoDrawerLogo;
