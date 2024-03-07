import { type FC } from 'react';

import { IFrameContextProvider } from 'proton-pass-extension/app/content/injections/apps/context/IFrameContextProvider';
import { ExtensionCore } from 'proton-pass-extension/lib/components/Extension/ExtensionCore';

import { Icons, NotificationsProvider } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { NotificationContent } from './views/NotificationContent';

import './Notification.scss';

export const Notification: FC = () => (
    <ExtensionCore endpoint="notification">
        <IFrameContextProvider endpoint="notification">
            <Icons />
            <ThemeProvider />
            <NotificationsProvider>
                <NotificationContent />
            </NotificationsProvider>
        </IFrameContextProvider>
    </ExtensionCore>
);
