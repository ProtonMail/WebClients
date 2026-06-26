import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import GetLumoPlusButton from '../primitives/GetLumoPlusButton';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

import './LumoSidebarUpsell.scss';

export const LumoSidebarUpsell = ({ feature = LUMO_UPSELL_PATHS.SIDEBAR_BUTTON }) => {
    const lumoPlusConfig = useLumoPlusUpsellConfig(feature);
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
        <div className="lumo-sidebar-upsell-section rounded-xl ml-0 md:ml-2 mr-2 mb-0 mx-auto overflow-y-auto bg-norm">
            <div className="rounded-sm flex flex-column flex-nowrap gap-3 p-4">
                <h4 className="text-rg text-semibold m-0">
                    {c('collider_2025: Upsell').t`Keep your chat history`}
                </h4>
                <p className="m-0 color-hint shrink-0 text-sm">{description}</p>
                {!canShowTalkToAdminLumoUpsell && lumoPlusConfig && (
                    <GetLumoPlusButton
                        path={lumoPlusConfig.path}
                        onClick={lumoPlusConfig.onUpgrade}
                        shape="solid"
                        color="norm"
                        className={lumoPlusConfig.className}
                    />
                )}
            </div>
        </div>
    );
};

LumoSidebarUpsell.displayName = 'LumoSidebarUpsell';
