import { StandardErrorPage, SubscriptionModalProvider } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import DeleteAccount from '../containers/DeleteAccount';
import SubscribeAccount from '../containers/SubscribeAccount';

enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
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

const MainContainer = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const action = queryParams.get('action');
    const client = queryParams.get('client');
    const defaultValues =
        {
            macOS: {
                redirect: 'protonvpn://refresh',
                fullscreen: 'off',
            },
        }[client || ''] || {};
    const redirect = queryParams.get('redirect') || defaultValues.redirect || undefined;
    const fullscreen = (queryParams.get('fullscreen') || defaultValues.fullscreen || undefined) !== 'off';
    const app = getApp(queryParams.get('app'), redirect);

    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {action === SupportedActions.SubscribeAccount && (
                <SubscriptionModalProvider app={app}>
                    <SubscribeAccount app={app} redirect={redirect} fullscreen={fullscreen} queryParams={queryParams} />
                </SubscriptionModalProvider>
            )}
        </>
    );
};

export default MainContainer;
