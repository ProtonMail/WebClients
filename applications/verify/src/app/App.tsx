import { BrowserRouter as Router } from 'react-router-dom';

import {
    ApiProvider,
    ConfigProvider,
    CreateNotificationOptions,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsHijack,
    PreventLeaveProvider,
    RightToLeftProvider,
    ThemeProvider,
} from '@proton/components';
import noop from '@proton/utils/noop';

import Verify from './Verify';
import broadcast, { MessageType } from './broadcast';
import * as config from './config';

import './app.scss';

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
                    <ThemeProvider>
                        <PreventLeaveProvider>
                            <NotificationsHijack onCreate={handleNotificationCreate}>
                                <ModalsProvider>
                                    <ApiProvider config={config} onLogout={noop} noErrorState>
                                        <Verify />
                                        <ModalsChildren />
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
