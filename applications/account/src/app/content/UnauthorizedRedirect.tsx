import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import type { Location } from 'history';

import useFlag from '@proton/components/containers/unleash/useFlag';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

const UnauthorizedRedirect = ({ initialLocation }: { initialLocation: Location }) => {
    const location = useLocation();
    const walletSignupEnabled = useFlag('WalletSignup');
    const walletRedirect =
        !walletSignupEnabled &&
        ([SSO_PATHS.WALLET_SIGN_IN, SSO_PATHS.WALLET_SIGNUP].includes(initialLocation.pathname as any) ||
            [SSO_PATHS.WALLET_SIGNUP].includes(location.pathname as any));

    useEffect(() => {
        if (walletRedirect) {
            if (location.pathname.includes('signup')) {
                replaceUrl(SSO_PATHS.SIGNUP);
            } else {
                replaceUrl(SSO_PATHS.LOGIN);
            }
        }
    }, [walletRedirect]);

    return null;
};

export default UnauthorizedRedirect;
