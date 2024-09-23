import type { ReactNode } from 'react';

import type { AppLinkProps } from '@proton/components/components/link/AppLink';
import AppLink from '@proton/components/components/link/AppLink';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';

interface ProductLinkProps {
    ownerApp: APP_NAMES;
    app?: APP_NAMES;
    appToLinkTo: APP_NAMES;
    user?: UserModel;
    current?: boolean;
    className?: string;
    children: ReactNode;
    reloadDocument?: AppLinkProps['reloadDocument'];
    target?: AppLinkProps['target'];
}

const ProductLink = ({
    ownerApp,
    app,
    appToLinkTo,
    user,
    current,
    className,
    children,
    reloadDocument,
    target,
}: ProductLinkProps) => {
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
                reloadDocument={reloadDocument}
                target={target}
            >
                {children}
            </AppLink>
        );
    }

    // If a user is passed here, it means the user is signed in (e.g. not viewing a public link)
    // and as such we should not show the static product links
    if (!user) {
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

    if (appToLinkTo === APPS.PROTONVPN_SETTINGS) {
        return (
            <SettingsLink
                path="/"
                app={appToLinkTo}
                key={appToLinkTo}
                title={appToLinkToName}
                className={className}
                aria-current={current}
                reloadDocument={reloadDocument}
                target={target}
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
            reloadDocument={reloadDocument}
            target={target}
        >
            {children}
        </AppLink>
    );
};

export default ProductLink;
