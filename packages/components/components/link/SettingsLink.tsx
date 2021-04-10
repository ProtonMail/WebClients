import React from 'react';
import { APPS, APPS_CONFIGURATION, APP_NAMES } from 'proton-shared/lib/constants';
import AppLink, { Props as AppLinkProps } from './AppLink';

export interface Props extends Omit<AppLinkProps, 'to' | 'toApp'> {
    path: string;
    app: APP_NAMES;
}

const SettingsLink = ({ path, app, children, ...rest }: Props) => {
    const slug = APPS_CONFIGURATION[app].settingsSlug;

    return (
        <AppLink to={`/${slug}${path}`} toApp={APPS.PROTONACCOUNT} {...rest}>
            {children}
        </AppLink>
    );
};

export default SettingsLink;
