import { AppsDropdown, UserDropdown } from '@proton/components';
import { APPS, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { InvitesButton } from '../components/InvitesButton/InvitesButton';
import LumoNavbarUpsell from '../upsells/composed/LumoNavbarUpsell';
import { HeaderWrapper } from './HeaderWrapper';

const { PROTONLUMO } = APPS;

export const PrivateHeader = () => {
    const isLumoEarlyAccessEnabled = useFlag('LumoEarlyAccess');

    return (
        <HeaderWrapper>
            {isLumoEarlyAccessEnabled && <InvitesButton />}
            <LumoNavbarUpsell feature={LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR} />
            <AppsDropdown app={PROTONLUMO} />
            <UserDropdown app={PROTONLUMO} />
        </HeaderWrapper>
    );
};
