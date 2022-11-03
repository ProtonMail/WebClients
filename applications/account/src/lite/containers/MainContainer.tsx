import { ConfigProvider, StandardErrorPage, SubscriptionModalProvider } from '@proton/components';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import DeleteAccount from './DeleteAccount';
import SubscribeAccount from './SubscribeAccount';
import VpnBlackFriday from './VpnBlackFriday';
import { SupportedActions } from './helper';

interface Props {
    action: SupportedActions | null;
    fullscreen: boolean;
    redirect: string | undefined;
    app: APP_NAMES;
    searchParams: URLSearchParams;
    config: ProtonConfig;
}

const MainContainer = ({ config, action, fullscreen, redirect, app, searchParams }: Props) => {
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
