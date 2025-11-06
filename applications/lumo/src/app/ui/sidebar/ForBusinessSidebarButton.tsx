import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon } from '@proton/components';

import { NewLabel } from '../components/NewLabel';

const LumoB2BUpsellLink = ({ isSmallScreen }: { isSmallScreen: boolean }) => {
    if (!isSmallScreen) {
        return null;
    }
    return (
        <Href
            href="https://lumo.proton.me/business"
            className="sidebar-item color-norm flex flex-row items-center flex-nowrap"
        >
            <div className="sidebar-item-icon">
                <Icon name="buildings" size={4} className="rtl:mirror" />
            </div>
            <span className="flex flex-row items-center flex-nowrap">
                <span className="sidebar-item-text">{c('collider_2025: b2b').t`For Business`} </span>
                <NewLabel className="ml-1" />
            </span>
        </Href>
    );
};

export default LumoB2BUpsellLink;
