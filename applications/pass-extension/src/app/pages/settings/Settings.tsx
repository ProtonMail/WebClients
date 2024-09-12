import type { FC } from 'react';
import { useCallback } from 'react';

import { ExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { ExtensionStore } from 'proton-pass-extension/lib/components/Extension/ExtensionStore';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { Localized } from '@proton/pass/components/Core/Localized';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsRouter } from './SettingsRouter';

import './Settings.scss';

export const Settings: FC = () => {
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    const handleWorkerMessage = useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.endpoint === 'page') {
            createNotification(enhance(message.payload.notification));
        }
    }, []);

    return (
        <ExtensionStore>
            <ExtensionClient onWorkerMessage={handleWorkerMessage}>
                <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Settings`} />
                <Localized>
                    <SettingsRouter />
                </Localized>
            </ExtensionClient>
        </ExtensionStore>
    );
};
