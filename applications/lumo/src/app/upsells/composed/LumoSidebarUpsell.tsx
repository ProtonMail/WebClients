import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { SidebarUpsellButton } from '../primitives/SidebarUpsellButton';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

export const LumoSidebarUpsell = ({ collapsed = false, feature = LUMO_UPSELL_PATHS.SIDEBAR_BUTTON }) => {
    // Fallback to regular Lumo Plus upsell config
    const lumoPlusConfig = useLumoPlusUpsellConfig(feature);
    // Fallback to regular Lumo Plus upsell
    if (!lumoPlusConfig || !lumoPlusConfig.showInSidebar) return null;

    return (
        <>
            <SidebarUpsellButton
                collapsed={collapsed}
                path={lumoPlusConfig.path}
                onClick={lumoPlusConfig.onUpgrade}
                className={lumoPlusConfig?.className}
            />
            {/* {lumoPlusConfig.modal?.render && (
                <LumoPlusUpsellModal
                    modalProps={lumoPlusConfig.modal.modalProps}
                    upsellRef={lumoPlusConfig.modal.upsellRef}
                    specialBackdrop
                />
            )} */}
        </>
    );
};

LumoSidebarUpsell.displayName = 'LumoSidebarUpsell';
