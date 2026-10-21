import type { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsHijack from '@proton/components/containers/notifications/NotificationsHijack';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { RightToLeftProvider } from '@proton/components/containers/rightToLeft/Provider';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';
import { PreventLeaveProvider } from '@proton/components/hooks/usePreventLeave';
import useInstance from '@proton/hooks/useInstance';
import Icons from '@proton/icons/Icons';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import createApi from '@proton/shared/lib/api/createApi';
import { isWebView } from '@proton/shared/lib/broadcast/broadcast';

import Verify from './Verify';
import broadcast, { MessageType } from './broadcast';
import config from './config';
import { setupStore } from './store/store';

const api = createApi({ config, noErrorState: true });

const handleNotificationCreate = (options: CreateNotificationOptions) => {
    const { type = 'success', text } = options;
    if (typeof text === 'string') {
        broadcast({ type: MessageType.NOTIFICATION, payload: { type, text } });
    }
};

const VerifyNotificationsProvider = ({ children }: { children: ReactNode }) =>
    isWebView ? (
        <NotificationsHijack onCreate={handleNotificationCreate}>{children}</NotificationsHijack>
    ) : (
        <NotificationsProvider>{children}</NotificationsProvider>
    );

const App = () => {
    const store = useInstance(setupStore);

    return (
        <ConfigProvider config={config}>
            <Router>
                <RightToLeftProvider>
                    <Icons />
                    <ThemeProvider appName={config.APP_NAME}>
                        <PreventLeaveProvider>
                            <VerifyNotificationsProvider>
                                <ModalsProvider>
                                    <ProtonStoreProvider store={store}>
                                        <ApiProvider api={api}>
                                            <Verify />
                                            <ModalsChildren />
                                            <NotificationsChildren />
                                        </ApiProvider>
                                    </ProtonStoreProvider>
                                </ModalsProvider>
                            </VerifyNotificationsProvider>
                        </PreventLeaveProvider>
                    </ThemeProvider>
                </RightToLeftProvider>
            </Router>
        </ConfigProvider>
    );
};

export default App;
