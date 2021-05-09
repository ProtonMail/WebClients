import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import { APP_NAMES, APPS, isSSOMode, isStandaloneMode, VPN_HOSTNAME } from 'proton-shared/lib/constants';
import { getAppHref, getAppHrefBundle } from 'proton-shared/lib/apps/helper';
import { LoginTypes } from 'proton-shared/lib/authentication/LoginInterface';
import { stripLeadingAndTrailingSlash } from 'proton-shared/lib/helpers/string';

import { useAuthentication, useConfig, useLoginType } from '../../hooks';
import Tooltip from '../tooltip/Tooltip';

export interface Props extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
    to: string;
    toApp?: APP_NAMES;
}

const AppLink = ({ to, toApp, children, ...rest }: Props, ref: React.Ref<HTMLAnchorElement>) => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const loginType = useLoginType();

    if (toApp && toApp !== APP_NAME) {
        if (isSSOMode) {
            // If in vpn-level account settings and want to visit the proton vpn app
            if (toApp === APPS.PROTONVPN_SETTINGS) {
                const href = `https://${VPN_HOSTNAME}/${stripLeadingAndTrailingSlash(to)}`;
                return (
                    // internal link, trusted
                    // eslint-disable-next-line react/jsx-no-target-blank
                    <a ref={ref} {...rest} target="_blank" href={href}>
                        {children}
                    </a>
                );
            }
            const localID = authentication.getLocalID?.();
            const href = getAppHref(to, toApp, localID);
            const isForceOpenSameTab =
                loginType === LoginTypes.TRANSIENT || loginType === LoginTypes.PERSISTENT_WORKAROUND;
            const overrides = isForceOpenSameTab
                ? {
                      target: '_self',
                  }
                : {};
            return (
                // internal link, trusted
                // eslint-disable-next-line react/jsx-no-target-blank
                <a ref={ref} target="_blank" {...rest} {...overrides} href={href}>
                    {children}
                </a>
            );
        }
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            const href = getAppHref(to, toApp);
            return (
                // internal link, trusted
                // eslint-disable-next-line react/jsx-no-target-blank
                <a ref={ref} target="_blank" {...rest} href={href}>
                    {children}
                </a>
            );
        }
        if (isStandaloneMode) {
            return (
                <Tooltip title="Disabled in standalone mode">
                    <a ref={ref} {...rest} onClick={(e) => e.preventDefault()} href="#">
                        {children}
                    </a>
                </Tooltip>
            );
        }
        const href = getAppHrefBundle(to, toApp);
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

export default React.forwardRef<HTMLAnchorElement, Props>(AppLink);
