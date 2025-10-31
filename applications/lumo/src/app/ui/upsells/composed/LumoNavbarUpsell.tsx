import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { BlackFridayOfferNavbarButton } from '../primitives/BlackFridayOfferNavbarButton';
import GetLumoPlusButton from '../primitives/GetLumoPlusButton';
import useLumoPlusUpsellButtonConfig from '../useLumoPlusUpsellButtonConfig';

interface LumoNavbarUpsellProps {
    feature?: UPSELL_FEATURE;
    onlyShowOffers?: boolean;
}

const LumoNavbarUpsell = ({
    feature = LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR,
    onlyShowOffers = false,
}: LumoNavbarUpsellProps) => {
    // Get the upsell config (handles modal opening via provider)
    const lumoPlusConfig = useLumoPlusUpsellButtonConfig(feature);

    // Don't show anything if no config or shouldn't show in navbar
    if (!lumoPlusConfig || !lumoPlusConfig.showInNavbar) return null;

    // Prioritize Black Friday offers when available
    if (lumoPlusConfig.hasBlackFridayOffer) {
        return (
            <BlackFridayOfferNavbarButton onUpgrade={lumoPlusConfig.onUpgrade} className={lumoPlusConfig.className} />
        );
    }

    // Show regular upgrade button (only if not in "offers only" mode)
    if (!onlyShowOffers) {
        return <GetLumoPlusButton path={lumoPlusConfig.path} onClick={lumoPlusConfig.onUpgrade} />;
    }

    return null;
};

LumoNavbarUpsell.displayName = 'LumoNavbarUpsell';

export default LumoNavbarUpsell;
