import type { FC } from 'react';
import { useCallback } from 'react';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Localized } from '@proton/pass/components/Core/Localized';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

import { ExtensionClient } from '../../../lib/components/Extension/ExtensionClient';
import { ExtensionPermissions } from '../../../lib/components/Extension/ExtensionPermissions';
import { ExtensionStore } from '../../../lib/components/Extension/ExtensionStore';
import { useExtensionNotificationEnhancer } from '../../../lib/hooks/useExtensionNotificationEnhancer';
import { hasClipboardPermissions } from '../../../lib/utils/permissions';
import type { WorkerMessageWithSender } from '../../../types/messages';
import { WorkerMessageType } from '../../../types/messages';
import { SettingsRouter } from './SettingsRouter';

import './Settings.scss';

export const Settings: FC = () => {
    const { createNotification } = useNotifications();
    const enhance = useExtensionNotificationEnhancer();

    const handleWorkerMessage = useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.endpoint === 'page') {
            createNotification(enhance(message.payload.notification));
        }
    }, []);

    return (
        <div
            className="pass-settings flex flex-column ui-standard w-full p-4 mx-auto bg-weak min-h-custom anime-fade-in"
            style={{ '--min-h-custom': '100vh' }}
        >
            <ExtensionStore>
                <ExtensionClient onWorkerMessage={handleWorkerMessage}>
                    {(ready) => (
                        <Localized>
                            <ExtensionPermissions>
                                <ClipboardProvider checkPermissions={hasClipboardPermissions}>
                                    <SettingsRouter ready={ready} />
                                </ClipboardProvider>
                            </ExtensionPermissions>
                        </Localized>
                    )}
                </ExtensionClient>
            </ExtensionStore>
        </div>
    );
};
