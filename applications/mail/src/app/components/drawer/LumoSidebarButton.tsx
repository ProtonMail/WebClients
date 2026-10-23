import { c } from 'ttag';

import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import LumoDrawerLogo from '@proton/components/components/drawer/drawerIcons/LumoDrawerLogo';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';

/** Docked, it toggles the drawer tab. Detached, it toggles whether Lumo is on screen at all: card, cat and ears. */
const LumoSidebarButton = () => {
    const { isDetached, isPanelOpen, isCurrentSurfaceOpen, isCatDismissed, toggleLumo, dismissCat } =
        useLumoFloatingPanel();
    const isLumoShown = isDetached ? !isCatDismissed : isCurrentSurfaceOpen;
    // Detached, the chat region only exists while the card is open
    const hasChatRegion = !isDetached || isPanelOpen;

    return (
        <DrawerAppButton
            tooltipText={LUMO_SHORT_APP_NAME}
            data-testid="lumo-drawer-app-button:lumo-icon"
            buttonContent={<LumoDrawerLogo className="m-1" />}
            onClick={isDetached && isLumoShown ? dismissCat : toggleLumo}
            alt={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
            aria-controls={hasChatRegion ? 'drawer-app-lumo' : undefined}
            aria-expanded={isLumoShown}
        />
    );
};

export default LumoSidebarButton;
