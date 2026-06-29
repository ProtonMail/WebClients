import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { SidebarUpsellSection } from '../../layouts/sidebar/components/SidebarUpsellSection';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import GetLumoPlusButton from '../primitives/GetLumoPlusButton';
import useLumoPlusUpsellButtonConfig from '../useLumoPlusUpsellButtonConfig';

export const LumoSidebarUpsell = ({ feature = LUMO_UPSELL_PATHS.SIDEBAR_BUTTON }) => {
    const lumoPlusConfig = useLumoPlusUpsellButtonConfig(feature);
    const { canShowTalkToAdminLumoUpsell, hasLumoPlus } = useLumoPlan();

    if (
        hasLumoPlus ||
        (!canShowTalkToAdminLumoUpsell && (!lumoPlusConfig || !lumoPlusConfig.showInSidebar))
    ) {
        return null;
    }

    const description = canShowTalkToAdminLumoUpsell
        ? c('collider_2025: Upsell')
              .t`Your chat history is limited to 7 days. Talk to your admin for unlimited chat history and other premium features.`
        : c('collider_2025: Upsell')
              .t`Your chat history is limited to 7 days. Upgrade to ${LUMO_SHORT_APP_NAME} Plus for unlimited history and other premium features.`;

    return (
        <SidebarUpsellSection title={c('collider_2025: Upsell').t`Keep your chat history`} description={description}>
            {!canShowTalkToAdminLumoUpsell && lumoPlusConfig && (
                <GetLumoPlusButton
                    path={lumoPlusConfig.path}
                    onClick={lumoPlusConfig.onUpgrade}
                    shape="solid"
                    color="norm"
                    className={lumoPlusConfig.className}
                />
            )}
        </SidebarUpsellSection>
    );
};

LumoSidebarUpsell.displayName = 'LumoSidebarUpsell';
