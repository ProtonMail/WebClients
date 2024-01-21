import { type VFC17 } from 'react';

import { Icons, NotificationsProvider } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { NotificationContent } from './views/NotificationContent';

import './Notification.scss';

export const Notification: VFC17 = () => (
    <IFrameContextProvider endpoint="notification">
        <Icons />
        <ThemeProvider />
        <NotificationsProvider>
            <NotificationContent />
        </NotificationsProvider>
    </IFrameContextProvider>
);
