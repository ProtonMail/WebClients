import React from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import useFlag from '@proton/unleash/useFlag';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { NewLabel } from '../components/NewLabel';

const LumoB2BUpsellLink = ({ isSmallScreen }: { isSmallScreen: boolean }) => {
    const isLumoB2BEnabled = useFlag('LumoB2B');
    const { isLumoPlanLoading, hasLumoB2B, isB2BAudience } = useLumoPlan();

    if (!isLumoB2BEnabled || hasLumoB2B || isLumoPlanLoading || !isSmallScreen || isMobile() || !isB2BAudience) {
        return null;
    }
    return (
        <Href
            href="https://account.proton.me/lumo/signup/business"
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
