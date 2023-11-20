import { ReactNode } from 'react';

import { IS_PROTON_USER_COOKIE_NAME } from '@proton/components/hooks/useIsProtonUserCookie';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { UserModel } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import { AppLink, SettingsLink } from '../../components';

export const apps = (user?: UserModel) => {
    if (user && user.Flags.sso && !user.Keys.length) {
        return [APPS.PROTONVPN_SETTINGS];
    }
    if (isElectronApp()) {
        return [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
    }
    return [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS].filter(
        isTruthy
    );
};

interface ProductLinkProps {
    ownerApp: APP_NAMES;
    app?: APP_NAMES;
    appToLinkTo: APP_NAMES;
    user?: UserModel;
    current?: boolean;
    className?: string;
    children: ReactNode;
}

const ProductLink = ({ ownerApp, app, appToLinkTo, user, current, className, children }: ProductLinkProps) => {
    const appToLinkToName = getAppName(appToLinkTo);

    if (user && app && getRequiresAddressSetup(appToLinkTo, user)) {
        const params = new URLSearchParams();
        params.set('to', appToLinkTo);
        params.set('from', app);
        if (ownerApp === APPS.PROTONACCOUNT) {
            params.set('from-type', 'settings');
        }
        return (
            <AppLink
                key={appToLinkTo}
                to={`${SETUP_ADDRESS_PATH}?${params.toString()}`}
                toApp={APPS.PROTONACCOUNT}
                title={appToLinkToName}
                className={className}
                aria-current={current}
            >
                {children}
            </AppLink>
        );
    }

    // This does not allow to get any user information but allow us to know if the user was already logged in Proton
    const isProtonUser = !!getCookie(IS_PROTON_USER_COOKIE_NAME);
    if (!isProtonUser) {
        return (
            <a
                href={getAppStaticUrl(appToLinkTo)}
                target="_blank"
                className={className}
                title={appToLinkToName}
                aria-current={current}
            >
                {children}
            </a>
        );
    }

    if (appToLinkTo === APPS.PROTONVPN_SETTINGS || appToLinkTo === APPS.PROTONPASS) {
        return (
            <SettingsLink
                path="/"
                app={appToLinkTo}
                key={appToLinkTo}
                title={appToLinkToName}
                className={className}
                aria-current={current}
            >
                {children}
            </SettingsLink>
        );
    }

    return (
        <AppLink
            key={appToLinkTo}
            to="/"
            toApp={appToLinkTo}
            title={appToLinkToName}
            className={className}
            aria-current={current}
        >
            {children}
        </AppLink>
    );
};

export default ProductLink;
