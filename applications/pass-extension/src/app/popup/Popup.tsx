import { useCallback, useContext, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';

import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import { useNotifications } from '@proton/app-context/useNotifications';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { Localized } from '@proton/pass/components/Core/Localized';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

import { ExtensionClient } from '../../lib/components/Extension/ExtensionClient';
import { ExtensionError } from '../../lib/components/Extension/ExtensionError';
import { ExtensionPermissions } from '../../lib/components/Extension/ExtensionPermissions';
import { ExtensionStore } from '../../lib/components/Extension/ExtensionStore';
import { useExtensionNotificationEnhancer } from '../../lib/hooks/useExtensionNotificationEnhancer';
import { hasClipboardPermissions } from '../../lib/utils/permissions';
import { WorkerMessageType, type WorkerMessageWithSender } from '../../types/messages';
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
                                        <ExtensionPermissions>
                                            <ClipboardProvider checkPermissions={hasClipboardPermissions}>
                                                <AppGuard />
                                            </ClipboardProvider>
                                        </ExtensionPermissions>
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
