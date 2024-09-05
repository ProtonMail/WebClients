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
import Icons from '@proton/icons/Icons';
import createApi from '@proton/shared/lib/api/createApi';

import Verify from './Verify';
import broadcast, { MessageType } from './broadcast';
import * as config from './config';

const api = createApi({ config, noErrorState: true });

const App = () => {
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
                                    <ApiProvider api={api}>
                                        <Verify />
                                        <ModalsChildren />
                                        <NotificationsChildren />
                                    </ApiProvider>
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
