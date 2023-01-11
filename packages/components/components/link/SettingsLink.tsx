import { Ref, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';

import { DEFAULT_APP, getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import { useConfig } from '../../hooks';
import AppLink, { AppLinkProps } from './AppLink';

const canOpenInSameTab = (APP_NAME: APP_NAMES, settingsApp: APP_NAMES | undefined, toSettingsForApp: APP_NAMES) => {
    const isIframe = window.self !== window.top;

    // If app is displayed inside an iframe, open settings in another tab
    if (isIframe) {
        return false;
    }

    // If in the "settings app", otherwise if any other app
    return settingsApp ? settingsApp === toSettingsForApp : APP_NAME === toSettingsForApp;
};

export interface Props extends Omit<AppLinkProps, 'to' | 'toApp'> {
    path: string;
    app?: APP_NAMES;
}

const SettingsLink = ({ path, app, children, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
    const location = useLocation();
    const { APP_NAME } = useConfig();

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return (
            <AppLink to={path} ref={ref} {...rest}>
                {children}
            </AppLink>
        );
    }

    const settingsApp =
        APP_NAME === APPS.PROTONACCOUNT ? getAppFromPathnameSafe(location.pathname) || DEFAULT_APP : undefined;
    // Don't allow to go for settings to proton account
    const toSettingsForApp = (app !== APPS.PROTONACCOUNT ? app : undefined) || settingsApp || APP_NAME;
    const slug = getSlugFromApp(toSettingsForApp);

    return (
        <AppLink
            to={`/${slug}${path}`}
            ref={ref}
            toApp={APPS.PROTONACCOUNT}
            // If going to settings for the same app
            target={canOpenInSameTab(APP_NAME, settingsApp, toSettingsForApp) ? '_self' : '_blank'}
            {...rest}
        >
            {children}
        </AppLink>
    );
};

export default forwardRef<HTMLAnchorElement, Props>(SettingsLink);
