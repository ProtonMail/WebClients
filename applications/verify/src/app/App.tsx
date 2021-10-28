import { CreateNotificationOptions, ModalsChildren, ProtonApp } from '@proton/components';

import * as config from './config';
import Verify from './Verify';
import NotificationsHijack from './NotificationsHijack';
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
        <ProtonApp config={enhancedConfig}>
            <NotificationsHijack onCreate={handleNotificationCreate}>
                <Verify />
                <ModalsChildren />
            </NotificationsHijack>
        </ProtonApp>
    );
};

export default App;
