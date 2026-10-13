import { c } from 'ttag';

import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import LumoDrawerLogo from '@proton/components/components/drawer/drawerIcons/LumoDrawerLogo';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';

/** A step larger than the neighbouring settings cog, to draw the eye to the assistant. */
const LumoHeaderButton = () => {
    const { isCurrentSurfaceOpen, toggleLumo } = useLumoFloatingPanel();

    return (
        <DrawerAppButton
            tooltipText={LUMO_SHORT_APP_NAME}
            tooltipPlacement="bottom"
            data-testid="lumo-drawer-app-button:lumo-icon"
            buttonContent={<LumoDrawerLogo size={6} className="m-1" />}
            onClick={toggleLumo}
            alt={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
            aria-controls="drawer-app-lumo"
            aria-expanded={isCurrentSurfaceOpen}
        />
    );
};

export default LumoHeaderButton;
