import { useLocation } from 'react-router-dom';

import type * as H from 'history';
import type { Paths } from 'proton-account/src/app/content/helper';
import AccountLoginContainer from 'proton-account/src/app/login/LoginContainer';
import type { MetaTags } from 'proton-account/src/app/useMetaTags';

import type { OnLoginCallback } from '@proton/components';
import { APPS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';
import { isMember } from '@proton/shared/lib/user/helpers';

interface Props {
    onLogin: OnLoginCallback;
    paths: Paths;
    metaTags: MetaTags;
    initialLocation?: H.Location;
}

const LoginContainer = ({ metaTags, onLogin, paths, initialLocation }: Props) => {
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
            hasRemember={false}
            externalRedirect={initialLocation?.pathname || ''}
            onLogin={async (data) => {
                if (vpnTestflight) {
                    document.location.assign('https://testflight.apple.com/join/3yl2MSbw');
                    return { state: 'complete' };
                }
                const { User } = data;
                const previousHash = initialLocation?.hash || '';
                const previousSearch = initialLocation?.search || '';
                const path = initialLocation?.pathname || (User && isMember(User) ? '/account-password' : '/dashboard');
                const pathWithSearch = `${path}${previousSearch}${previousHash}`;
                return onLogin({ ...data, path: pathWithSearch });
            }}
        />
    );
};

export default LoginContainer;
