import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { APPS } from '@proton/shared/lib/constants';

import type { OnLoginCallback } from '../authSession';
import { usePublicAppAuth } from '../publicAppAuth';
import VpnSignup from '../signupCtx/flows/vpn/VpnSignup';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { runLogin } from '../state-machine/runLogin';
import { getSignupMeta } from './signupPagesJson';

const PublicAppVpnSignup = () => {
    const { onPreSubmit, onStartAuth, onSessionExpired } = usePublicAppAuth();
    const publicApp = PublicAppContext.useActorRef();
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);

    return (
        <VpnSignup
            metaTags={getSignupMeta(APPS.PROTONVPN_SETTINGS)}
            toApp={APPS.PROTONVPN_SETTINGS}
            toAppName={getToAppName(APPS.PROTONVPN_SETTINGS)}
            onLogin={onLogin}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
            onSessionExpired={onSessionExpired}
        />
    );
};

export default PublicAppVpnSignup;
