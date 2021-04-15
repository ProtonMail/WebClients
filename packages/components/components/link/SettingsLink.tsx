import React from 'react';
import { APPS, APP_NAMES } from 'proton-shared/lib/constants';
import { DEFAULT_APP, getAppFromPathnameSafe, getSlugFromApp } from 'proton-shared/lib/apps/slugHelper';
import { useLocation } from 'react-router-dom';
import AppLink, { Props as AppLinkProps } from './AppLink';
import { useConfig } from '../../hooks';

export interface Props extends Omit<AppLinkProps, 'to' | 'toApp'> {
    path: string;
    app?: APP_NAMES;
}

const SettingsLink = ({ path, app, children, ...rest }: Props) => {
    const location = useLocation();
    const { APP_NAME } = useConfig();

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return (
            <AppLink to={path} {...rest}>
                {children}
            </AppLink>
        );
    }

    const settingsApp = APP_NAME === APPS.PROTONACCOUNT ? getAppFromPathnameSafe(location.pathname) : undefined;
    const slug = getSlugFromApp(settingsApp || app || DEFAULT_APP);

    return (
        <AppLink to={`/${slug}${path}`} toApp={APPS.PROTONACCOUNT} {...rest}>
            {children}
        </AppLink>
    );
};

export default SettingsLink;
