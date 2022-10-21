import {
    ConfigProvider,
    StandardErrorPage,
    SubscriptionModalProvider,
    useActiveBreakpoint,
    useConfig,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getRedirect } from '@proton/shared/lib/subscription/redirect';

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

enum FullscreenOption {
    On,
    Off,
    Auto,
}

const getFullscreenOption = (value: string | null | undefined) => {
    if (value === 'off' || value === 'false') {
        return FullscreenOption.Off;
    }
    if (value === 'auto') {
        return FullscreenOption.Auto;
    }
    return FullscreenOption.On;
};

const MainContainer = () => {
    const config = useConfig();
    const { isNarrow } = useActiveBreakpoint();

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
    const fullscreenOption = getFullscreenOption(
        searchParams.get('fullscreen') || defaultValues.fullscreen || undefined
    );
    const app = getApp(searchParams.get('app'), redirect);
    const fullscreen = (() => {
        if (fullscreenOption === FullscreenOption.Auto) {
            return isNarrow;
        }
        return fullscreenOption !== FullscreenOption.Off;
    })();

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
