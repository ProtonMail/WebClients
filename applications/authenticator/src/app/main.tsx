import ReactDOM from 'react-dom/client';

import { config, sentryConfig } from 'proton-authenticator/lib/app/env';
import 'proton-authenticator/lib/tauri/runtime';

import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import Icons from '@proton/icons/Icons';
import sentry from '@proton/shared/lib/helpers/sentry';

import { UpdateBar } from './components/Layout/UpdateBar';
import { ItemActionsProvider } from './providers/ItemActionsProvider';
import { StoreProvider } from './providers/StoreProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { App } from './views/App';
import { AuthGuard } from './views/AuthGuard';

import './main.scss';

sentry({ config, sentryConfig });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <>
        <Icons />
        <NotificationsProvider>
            <ModalsProvider>
                <StoreProvider>
                    <ThemeProvider>
                        <AuthGuard>
                            <ItemActionsProvider>
                                <App />
                                <UpdateBar />
                            </ItemActionsProvider>
                        </AuthGuard>
                        <ModalsChildren />
                        <NotificationsChildren />
                    </ThemeProvider>
                </StoreProvider>
            </ModalsProvider>
        </NotificationsProvider>
    </>
);
