import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { SidebarUpsellButton } from '../primitives/SidebarUpsellButton';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

export const LumoSidebarUpsell = ({ feature = LUMO_UPSELL_PATHS.SIDEBAR_BUTTON }) => {
    const lumoPlusConfig = useLumoPlusUpsellConfig(feature);
    if (!lumoPlusConfig || !lumoPlusConfig.showInSidebar) return null;

    return (
        <>
            <SidebarUpsellButton
                collapsed={false}
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
