import { AppsDropdown, UserDropdown } from '@proton/components';
import { APPS, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import LumoNavbarUpsell from '../upsells/composed/LumoNavbarUpsell';
import { HeaderWrapper } from './HeaderWrapper';

const { PROTONLUMO } = APPS;

export const PrivateHeader = () => {

    return (
        <HeaderWrapper>
            <LumoNavbarUpsell feature={LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR} />
            <AppsDropdown app={PROTONLUMO} />
            <UserDropdown app={PROTONLUMO} />
        </HeaderWrapper>
    );
};
