import { BrowserRouter as Router } from 'react-router-dom';

import type { CreateNotificationOptions } from '@proton/components';
import {
    ApiProvider,
    ConfigProvider,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsHijack,
    PreventLeaveProvider,
    RightToLeftProvider,
    ThemeProvider,
} from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import Icons from '@proton/icons/Icons';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import createApi from '@proton/shared/lib/api/createApi';

import Verify from './Verify';
import broadcast, { MessageType } from './broadcast';
import config from './config';
import { setupStore } from './store/store';

const api = createApi({ config, noErrorState: true });

const App = () => {
    const store = useInstance(setupStore);
    const handleNotificationCreate = (options: CreateNotificationOptions) => {
        const { type = 'success', text } = options;

        if (typeof text === 'string') {
            broadcast({
                type: MessageType.NOTIFICATION,
                payload: { type, text },
            });
        }
    };

    return (
        <ConfigProvider config={config}>
            <Router>
                <RightToLeftProvider>
                    <Icons />
                    <ThemeProvider appName={config.APP_NAME}>
                        <PreventLeaveProvider>
                            <NotificationsHijack onCreate={handleNotificationCreate}>
                                <ModalsProvider>
                                    <ProtonStoreProvider store={store}>
                                        <ApiProvider api={api}>
                                            <Verify />
                                            <ModalsChildren />
                                            <NotificationsChildren />
                                        </ApiProvider>
                                    </ProtonStoreProvider>
                                </ModalsProvider>
                            </NotificationsHijack>
                        </PreventLeaveProvider>
                    </ThemeProvider>
                </RightToLeftProvider>
            </Router>
        </ConfigProvider>
    );
};

export default App;
