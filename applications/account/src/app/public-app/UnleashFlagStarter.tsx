import { useEffect } from 'react';

import type * as H from 'history';

import { SSO_PATHS } from '@proton/shared/lib/constants';

import { PublicAppContext } from './state-machine/PublicAppContext';

// Feature flags are not needed in these routes. That allows us to prevent creating an unauth session if only these routes would be requested.
const UnleashFlagStarter = ({ location }: { location: H.Location }) => {
    const publicApp = PublicAppContext.useActorRef();
    useEffect(() => {
        if (![SSO_PATHS.SWITCH].some((pathname) => pathname === location.pathname)) {
            publicApp.send({ type: 'flags.requested' });
        }
    }, [location.pathname]);
    return null;
};

export default UnleashFlagStarter;
