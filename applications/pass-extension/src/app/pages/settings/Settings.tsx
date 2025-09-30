import type { FC } from 'react';
import { useCallback } from 'react';

import { ExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { ExtensionStore } from 'proton-pass-extension/lib/components/Extension/ExtensionStore';
import { useExtensionNotificationEnhancer } from 'proton-pass-extension/lib/hooks/useExtensionNotificationEnhancer';
import type { WorkerMessageWithSender } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { useNotifications } from '@proton/components';
import { Localized } from '@proton/pass/components/Core/Localized';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

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
                            <ClipboardProvider>
                                <SettingsRouter ready={ready} />
                            </ClipboardProvider>
                        </Localized>
                    )}
                </ExtensionClient>
            </ExtensionStore>
        </div>
    );
};
