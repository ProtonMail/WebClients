import { useLocation } from 'react-router-dom';

import * as H from 'history';
import { Paths } from 'proton-account/src/app/content/helper';
import AccountLoginContainer from 'proton-account/src/app/login/LoginContainer';
import { MetaTags } from 'proton-account/src/app/useMetaTags';

import { OnLoginCallback } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { isMember } from '@proton/shared/lib/user/helpers';

interface Props {
    onLogin: OnLoginCallback;
    paths: Paths;
    metaTags: MetaTags;
}

const LoginContainer = ({ metaTags, onLogin, paths }: Props) => {
    const location = useLocation<{ from?: H.Location }>();
    const searchParams = new URLSearchParams(location.search);
    const vpnTestflight = searchParams.get('redirect') === 'ios-beta';

    return (
        <AccountLoginContainer
            testflight={vpnTestflight ? 'vpn' : undefined}
            metaTags={metaTags}
            paths={paths}
            toApp={APPS.PROTONVPN_SETTINGS}
            setupVPN={false}
            hasRemember={false}
            onLogin={async (data) => {
                if (vpnTestflight) {
                    document.location.assign('https://testflight.apple.com/join/3yl2MSbw');
                    return { state: 'complete' };
                }
                const { User } = data;
                const previousLocation = location.state?.from;
                const previousHash = previousLocation?.hash || '';
                const previousSearch = previousLocation?.search || '';
                const path = previousLocation?.pathname || (User && isMember(User) ? '/account' : '/dashboard');
                const pathWithSearch = `${path}${previousSearch}${previousHash}`;
                return onLogin({ ...data, path: pathWithSearch });
            }}
        />
    );
};

export default LoginContainer;
