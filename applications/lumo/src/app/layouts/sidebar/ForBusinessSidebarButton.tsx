import { c } from 'ttag';

import { Icon } from '@proton/components';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import LumoB2BUpsellLink from "../../upsells/components/B2BUpsellLink";

const ForBusinessSidebarButton = ({ isSmallScreen }: { isSmallScreen: boolean }) => {
    const { showForBusinessLink } = useLumoPlan();
    if (!isSmallScreen || !showForBusinessLink) {
        return null;
    }
    return (
        <LumoB2BUpsellLink className="sidebar-item color-norm flex flex-row items-center flex-nowrap">
            <div className="sidebar-item-icon">
                <Icon name="buildings" size={4} className="rtl:mirror" />
            </div>
            <span className="flex flex-row items-center flex-nowrap">
                <span className="sidebar-item-text">{c('collider_2025: b2b').t`For Business`} </span>
            </span>
        </LumoB2BUpsellLink>
    );
};

export default ForBusinessSidebarButton;
