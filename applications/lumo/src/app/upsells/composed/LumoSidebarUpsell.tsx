import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import GetLumoPlusButton from '../primitives/GetLumoPlusButton';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

export const LumoSidebarUpsell = ({ feature = LUMO_UPSELL_PATHS.SIDEBAR_BUTTON }) => {
    const lumoPlusConfig = useLumoPlusUpsellConfig(feature);
    if (!lumoPlusConfig || !lumoPlusConfig.showInSidebar) return null;

    return (
        <GetLumoPlusButton path={lumoPlusConfig.path} onClick={lumoPlusConfig.onUpgrade} shape="solid" color="norm" />
    );
};

LumoSidebarUpsell.displayName = 'LumoSidebarUpsell';
