import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import { APP_NAMES, isSSOMode, isStandaloneMode } from 'proton-shared/lib/constants';
import { getAppHref, getAppHrefBundle } from 'proton-shared/lib/apps/helper';

import { useConfig, useAuthentication } from '../../hooks';
import Href, { Props as HrefProps } from './Href';
import Tooltip from '../tooltip/Tooltip';

export interface Props extends HrefProps {
    to: string;
    toApp?: APP_NAMES;
}

const AppLink = ({ to, toApp, children, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();

    if (toApp && toApp !== APP_NAME) {
        if (isSSOMode) {
            const localID = authentication.getLocalID?.();
            const href = getAppHref(to, toApp, localID);
            return (
                <Href target="_blank" {...rest} href={href}>
                    {children}
                </Href>
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
            <Href {...rest} href={href} target="_self">
                {children}
            </Href>
        );
    }

    return (
        <ReactRouterLink to={to} {...rest}>
            {children}
        </ReactRouterLink>
    );
};

export default AppLink;
