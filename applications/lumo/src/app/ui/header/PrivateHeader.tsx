import React from 'react';

import { AppsDropdown, UserDropdown } from '@proton/components';
import { APPS, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { InvitesButton } from '../components/InvitesButton/InvitesButton';
import { HeaderWrapper } from './HeaderWrapper';
import LumoUpgradeButton from './LumoUpgradeButton';

const { PROTONLUMO } = APPS;

export const PrivateHeader = () => {
    const isLumoEarlyAccessEnabled = useFlag('LumoEarlyAccess');

    return (
        <HeaderWrapper>
            {isLumoEarlyAccessEnabled && <InvitesButton />}
            <LumoUpgradeButton feature={LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR} buttonComponent="promotion-button" />
            <AppsDropdown app={PROTONLUMO} />
            <UserDropdown app={PROTONLUMO} />
        </HeaderWrapper>
    );
};
