import type { VFC } from 'react';

import { ConfigProvider, Icons, NotificationsProvider } from '@proton/components';

import * as config from '../../../../app/config';
import { ThemeProvider } from '../../../../shared/theme/ThemeProvider';
import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { NotificationContent } from './views/NotificationContent';

import './Notification.scss';

export const Notification: VFC = () => (
    <IFrameContextProvider endpoint="notification">
        <ConfigProvider config={config}>
            <Icons />
            <ThemeProvider />
            <NotificationsProvider>
                <NotificationContent />
            </NotificationsProvider>
        </ConfigProvider>
    </IFrameContextProvider>
);
