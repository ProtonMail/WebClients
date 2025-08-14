import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

interface Props {
    children: ReactNode;
}

/* For initial launch, /guest will be behind a LumoEarlyAccess FF. Normlly, the user is redirected to /guest
from the private account app,  but to limit this FF usage to lumo scope, we are using this component to redirect user to
account.proton.me/lumo if the FF is enabled. Multiple redirections is not ideal, but this is expected to be temporary  */

const ProtectGuestRouteGuard = ({ children }: Props) => {
    const isLumoEarlyAccessEnabled = useFlag('LumoEarlyAccess');
    const isLumoDeactivateGuestModeEnabled = useFlag('LumoDeactivateGuestModeFrontend');

    const accountHref = getAppHref('lumo', APPS.PROTONACCOUNT);

    useEffect(() => {
        if (isLumoEarlyAccessEnabled || isLumoDeactivateGuestModeEnabled) {
            window.location.href = accountHref;
        }
    }, [isLumoEarlyAccessEnabled, isLumoDeactivateGuestModeEnabled, accountHref]);

    if (isLumoEarlyAccessEnabled || isLumoDeactivateGuestModeEnabled) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectGuestRouteGuard;
