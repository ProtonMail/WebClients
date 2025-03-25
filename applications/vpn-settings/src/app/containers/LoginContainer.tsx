import { useLocation } from 'react-router-dom';

import type * as H from 'history';
import type { Paths } from 'proton-account/src/app/content/helper';
import AccountLoginContainer, {
    type LoginContainerState as AccountLoginContainerState,
} from 'proton-account/src/app/login/LoginContainer';
import type { MetaTags } from 'proton-account/src/app/useMetaTags';

import type { OnLoginCallback } from '@proton/components';
import { APPS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';

export type LoginContainerState = AccountLoginContainerState;

interface Props {
    onLogin: OnLoginCallback;
    paths: Paths;
    metaTags: MetaTags;
    initialLocation?: H.Location;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

const LoginContainer = ({ metaTags, onLogin, paths, initialLocation, onPreSubmit, onStartAuth }: Props) => {
    const location = useLocation<{ from?: H.Location }>();
    const searchParams = new URLSearchParams(location.search);
    const vpnTestflight = searchParams.get('redirect') === 'ios-beta';

    return (
        <AccountLoginContainer
            testflight={vpnTestflight ? 'vpn' : undefined}
            metaTags={metaTags}
            // Disable create account for /appletv because it has payments
            paths={initialLocation?.pathname === VPN_TV_PATHS_MAP.apple ? { ...paths, signup: '' } : paths}
            toApp={APPS.PROTONVPN_SETTINGS}
            productParam={APPS.PROTONVPN_SETTINGS}
            setupVPN={false}
            externalRedirect={initialLocation?.pathname || ''}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
            onLogin={async (session) => {
                if (vpnTestflight) {
                    document.location.assign('https://testflight.apple.com/join/3yl2MSbw');
                    return { state: 'complete' };
                }
                return onLogin(session);
            }}
        />
    );
};

export default LoginContainer;
