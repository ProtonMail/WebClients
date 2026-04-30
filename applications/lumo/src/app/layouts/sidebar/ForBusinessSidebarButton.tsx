import { c } from 'ttag';

import { IcBuildings } from '@proton/icons/icons/IcBuildings';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import LumoB2BUpsellLink from '../../upsells/components/B2BUpsellLink';

const ForBusinessSidebarButton = ({ isSmallScreen }: { isSmallScreen: boolean }) => {
    const { showForBusinessLink } = useLumoPlan();
    if (!isSmallScreen || !showForBusinessLink) {
        return null;
    }
    return (
        <LumoB2BUpsellLink className="sidebar-item flex items-center w-full cursor-pointer py-2 px-1.5">
            <div className="sidebar-item-icon flex items-center justify-center shrink-0 mr-1.5">
                <IcBuildings size={4} className="rtl:mirror" />
            </div>
            <span className="sidebar-item-text flex-1 flex items-center text-nowrap overflow-hidden">
                {c('collider_2025: b2b').t`For Business`}
            </span>
        </LumoB2BUpsellLink>
    );
};

export default ForBusinessSidebarButton;
