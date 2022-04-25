import { forwardRef, Ref } from 'react';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { DEFAULT_APP, getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { useLocation } from 'react-router-dom';
import AppLink, { AppLinkProps } from './AppLink';
import { useConfig } from '../../hooks';

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

    // If in the "settings app", otherwise if any other app
    const isGoingToSameSettings = settingsApp ? settingsApp === toSettingsForApp : APP_NAME === toSettingsForApp;

    return (
        <AppLink
            to={`/${slug}${path}`}
            ref={ref}
            toApp={APPS.PROTONACCOUNT}
            // If going to settings for the same app
            target={isGoingToSameSettings ? '_self' : '_blank'}
            {...rest}
        >
            {children}
        </AppLink>
    );
};

export default forwardRef<HTMLAnchorElement, Props>(SettingsLink);
