import { ConfigProvider, StandardErrorPage, SubscriptionModalProvider, useConfig } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import DeleteAccount from './DeleteAccount';
import SubscribeAccount from './SubscribeAccount';
import VpnBlackFriday from './VpnBlackFriday';

enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    VpnBlackFriday = 'vpn-black-friday',
}

const getApp = (appQueryParam: string | null, redirect: string | undefined) => {
    if (appQueryParam === 'vpn') {
        return APPS.PROTONVPN_SETTINGS;
    }
    if (appQueryParam === 'mail') {
        return APPS.PROTONMAIL;
    }
    if (appQueryParam === 'drive') {
        return APPS.PROTONDRIVE;
    }
    if (redirect) {
        if (redirect.includes('vpn')) {
            return APPS.PROTONVPN_SETTINGS;
        }
        if (redirect.includes('mail')) {
            return APPS.PROTONMAIL;
        }
        if (redirect.includes('drive')) {
            return APPS.PROTONDRIVE;
        }
    }
    return APPS.PROTONVPN_SETTINGS;
};

const getRedirect = (redirect?: string) => {
    return redirect && /^(\/$|\/[^/]|proton(vpn|mail|drive)?:\/\/)/.test(redirect) ? redirect : undefined;
};

const MainContainer = () => {
    const config = useConfig();
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    const client = searchParams.get('client');
    const defaultValues =
        {
            macOS: {
                redirect: 'protonvpn://refresh',
                fullscreen: 'off',
            },
        }[client || ''] || {};
    const redirect = getRedirect(searchParams.get('redirect') || defaultValues.redirect || undefined);
    const fullscreenParam = searchParams.get('fullscreen') || defaultValues.fullscreen || undefined;
    const fullscreen = fullscreenParam !== 'off' && fullscreenParam !== 'false';
    const app = getApp(searchParams.get('app'), redirect);

    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {action === SupportedActions.SubscribeAccount && (
                <SubscriptionModalProvider app={app}>
                    <SubscribeAccount
                        app={app}
                        redirect={redirect}
                        fullscreen={fullscreen}
                        queryParams={searchParams}
                    />
                </SubscriptionModalProvider>
            )}
            {action === SupportedActions.VpnBlackFriday && (
                <ConfigProvider config={{ ...config, APP_NAME: APPS.PROTONVPN_SETTINGS }}>
                    <SubscriptionModalProvider app={APPS.PROTONVPN_SETTINGS}>
                        <VpnBlackFriday redirect={redirect} fullscreen={fullscreen} />
                    </SubscriptionModalProvider>
                </ConfigProvider>
            )}
        </>
    );
};

export default MainContainer;
