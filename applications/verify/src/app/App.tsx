import { BrowserRouter as Router } from 'react-router-dom';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    ApiProvider,
    ConfigProvider,
    CreateNotificationOptions,
    ThemeProvider,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsHijack,
    PreventLeaveProvider,
    RightToLeftProvider,
} from '@proton/components';

import * as config from './config';
import Verify from './Verify';
import broadcast, { MessageType } from './broadcast';
import './app.scss';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0',
    ...config,
};

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
        <ConfigProvider config={enhancedConfig}>
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
