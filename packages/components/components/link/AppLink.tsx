import { AnchorHTMLAttributes, Ref, forwardRef } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

import { getAppHref, getAppHrefBundle } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, VPN_HOSTNAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';

import { useAuthentication, useConfig } from '../../hooks';
import Tooltip from '../tooltip/Tooltip';

export interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
    to: string;
    toApp?: APP_NAMES;
    selfOpening?: boolean;
}

const INTERNAL_LINK_TARGET: AppLinkProps['target'] = isElectronMail ? '_top' : '_blank';

const AppLink = ({ to, toApp, selfOpening = false, children, ...rest }: AppLinkProps, ref: Ref<HTMLAnchorElement>) => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();

    const targetApp = selfOpening ? APP_NAME : toApp;

    if (targetApp && (targetApp !== APP_NAME || selfOpening)) {
        if (authentication.mode === 'sso') {
            // If in vpn-level account settings and want to visit the proton vpn app
            if (targetApp === APPS.PROTONVPN_SETTINGS) {
                const href = `https://${VPN_HOSTNAME}/${stripLeadingAndTrailingSlash(to)}`;
                return (
                    // internal link, trusted
                    <a ref={ref} {...rest} target={INTERNAL_LINK_TARGET} href={href}>
                        {children}
                    </a>
                );
            }
            const localID = authentication.getLocalID?.();

            const href = getAppHref(to, targetApp, localID);
            return (
                // internal link, trusted
                <a ref={ref} target={INTERNAL_LINK_TARGET} {...rest} href={href}>
                    {children}
                </a>
            );
        }
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            const href = getAppHref(to, targetApp);
            return (
                // internal link, trusted
                <a ref={ref} target={INTERNAL_LINK_TARGET} {...rest} href={href}>
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
