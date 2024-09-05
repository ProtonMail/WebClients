import type { FC } from 'react';
import { createRoot } from 'react-dom/client';

import { IFrameApp } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ExtensionCore } from 'proton-pass-extension/lib/components/Extension/ExtensionCore';

import { NotificationsProvider } from '@proton/components';
import Icons from '@proton/icons/Icons';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { Notification } from './Notification';

const App: FC = () => (
    <ExtensionCore endpoint="notification">
        <IFrameApp endpoint="notification">
            <Icons />
            <ThemeProvider />
            <NotificationsProvider>
                <Notification />
            </NotificationsProvider>
        </IFrameApp>
    </ExtensionCore>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
