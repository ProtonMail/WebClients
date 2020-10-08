import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import { APPS, APP_NAMES, isSSOMode, isStandaloneMode } from 'proton-shared/lib/constants';
import { getAppHref, getAppHrefBundle } from 'proton-shared/lib/apps/helper';
import { LoginTypes } from 'proton-shared/lib/authentication/LoginInterface';

import { useAuthentication, useConfig, useLoginType } from '../../hooks';
import Tooltip from '../tooltip/Tooltip';

export interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    toApp?: APP_NAMES;
}

const AppLink = ({ to, toApp, children, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const loginType = useLoginType();

    if (toApp && toApp !== APP_NAME) {
        if (isSSOMode) {
            const localID = authentication.getLocalID?.();
            const href = getAppHref(to, toApp, localID);
            const isForceOpenSameTab =
                loginType === LoginTypes.TRANSIENT || loginType === LoginTypes.PERSISTENT_WORKAROUND;
            const overrides = isForceOpenSameTab
                ? {
                      target: '_self',
                  }
                : {};
            const isSameApp =
                (APP_NAME === APPS.PROTONMAIL && toApp === APPS.PROTONMAIL_SETTINGS) ||
                (APP_NAME === APPS.PROTONMAIL_SETTINGS && toApp === APPS.PROTONMAIL);
            const target = isSameApp ? '_self' : '_blank';
            return (
                // internal link, trusted
                // eslint-disable-next-line react/jsx-no-target-blank
                <a target={target} {...rest} {...overrides} href={href}>
                    {children}
                </a>
            );
        }
        if (isStandaloneMode) {
            return (
                <Tooltip className={rest.className} title="Disabled in standalone mode">
                    {children}
                </Tooltip>
            );
        }
        const href = getAppHrefBundle(to, toApp);
        return (
            <a target="_self" {...rest} href={href}>
                {children}
            </a>
        );
    }

    return (
        <ReactRouterLink to={to} {...rest}>
            {children}
        </ReactRouterLink>
    );
};

export default AppLink;
