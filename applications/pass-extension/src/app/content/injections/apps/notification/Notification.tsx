import { type FC } from 'react';

import { Icons, NotificationsProvider } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { NotificationContent } from './views/NotificationContent';

import './Notification.scss';

export const Notification: FC = () => (
    <IFrameContextProvider endpoint="notification">
        <Icons />
        <ThemeProvider />
        <NotificationsProvider>
            <NotificationContent />
        </NotificationsProvider>
    </IFrameContextProvider>
);
