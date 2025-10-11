import { useCallback, useContext, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';

import { ExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { ExtensionError } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { ExtensionStore } from 'proton-pass-extension/lib/components/Extension/ExtensionStore';
import { useExtensionNotificationEnhancer } from 'proton-pass-extension/lib/hooks/useExtensionNotificationEnhancer';
import { hasClipboardPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { WorkerMessageType, type WorkerMessageWithSender } from 'proton-pass-extension/types/messages';

import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import NotificationsContext from '@proton/components/containers/notifications/notificationsContext';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Localized } from '@proton/pass/components/Core/Localized';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

import { AppGuard } from './AppGuard';
import { PopupProvider } from './PopupProvider';

import './Popup.scss';

export const Popup = () => {
    const notificationsManager = useContext(NotificationsContext);
    const { createNotification } = useNotifications();
    const enhance = useExtensionNotificationEnhancer();

    const onWorkerMessage = useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION) {
            createNotification(enhance(message.payload.notification));
        }
    }, []);

    useEffect(() => notificationsManager.setOffset({ y: 10 }), []);

    return (
        <ExtensionStore>
            <ExtensionClient onWorkerMessage={onWorkerMessage}>
                {(ready) => (
                    <ErrorBoundary component={<ExtensionError />}>
                        <Router>
                            <NavigationProvider>
                                <PopupProvider ready={ready}>
                                    <Localized>
                                        <ClipboardProvider checkPermissions={hasClipboardPermissions}>
                                            <AppGuard />
                                        </ClipboardProvider>
                                    </Localized>
                                </PopupProvider>
                            </NavigationProvider>
                        </Router>
                    </ErrorBoundary>
                )}
            </ExtensionClient>
        </ExtensionStore>
    );
};
