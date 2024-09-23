import type { AnchorHTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { getAppHref, getAppHrefBundle } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, VPN_HOSTNAME } from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';

import { useAuthentication, useConfig } from '../../hooks';

export interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
    to: string;
    toApp?: APP_NAMES;
    reloadDocument?: boolean; // The reloadDocument property can be used to skip client side routing and let the browser handle the transition normally (as if it were an <a href>).
}

const AppLink = ({ to, toApp, reloadDocument, children, ...rest }: AppLinkProps, ref: Ref<HTMLAnchorElement>) => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();

    const targetApp = toApp ?? (reloadDocument ? APP_NAME : undefined);

    if (targetApp && (targetApp !== APP_NAME || reloadDocument)) {
        if (authentication.mode === 'sso') {
            // If in vpn-level account settings and want to visit the proton vpn app
            if (targetApp === APPS.PROTONVPN_SETTINGS) {
                const href = `https://${VPN_HOSTNAME}/${stripLeadingAndTrailingSlash(to)}`;
                return (
                    // internal link, trusted
                    <a ref={ref} {...rest} target="_blank" href={href}>
                        {children}
                    </a>
                );
            }
            const localID = authentication.getLocalID?.();

            const href = getAppHref(to, targetApp, localID);
            return (
                // internal link, trusted
                <a ref={ref} target="_blank" {...rest} href={href}>
                    {children}
                </a>
            );
        }
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            const href = getAppHref(to, targetApp);
            return (
                // internal link, trusted
                <a ref={ref} target="_blank" {...rest} href={href}>
                    {children}
                </a>
            );
        }
        if (authentication.mode === 'standalone') {
            return (
                <Tooltip title="Disabled in standalone mode">
                    <a ref={ref} {...rest} onClick={(e) => e.preventDefault()} href="#">
                        {children}
                    </a>
                </Tooltip>
            );
        }
        const href = getAppHrefBundle(to, targetApp);

        return (
            <a ref={ref} target="_self" {...rest} href={href}>
                {children}
            </a>
        );
    }

    return (
        <ReactRouterLink ref={ref} to={to} {...rest}>
            {children}
        </ReactRouterLink>
    );
};

export default forwardRef<HTMLAnchorElement, AppLinkProps>(AppLink);
