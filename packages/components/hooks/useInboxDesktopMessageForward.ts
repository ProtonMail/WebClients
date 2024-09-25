import { useEffect } from 'react';

import type { PayloadOfIPCInboxHostUpdateType } from '@proton/shared/lib/desktop/desktopTypes';
import { canListenInboxDesktopHostMessages } from '@proton/shared/lib/desktop/ipcHelpers';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

export function useInboxDesktopMessageForward() {
    useEffect(() => {
        if (!canListenInboxDesktopHostMessages) {
            return;
        }

        const listener = window.ipcInboxMessageBroker!.on!(
            'captureMessage',
            // THIS DOESN"T WORK: (payload: PayloadOfIPCInboxHostUpdateType<'captureMessage'>) => {
            // THIS DOESN'T WORK (payload) => {
            (payload: PayloadOfIPCInboxHostUpdateType<'captureMessage'>) => {
                captureMessage(payload.message, {
                    level: payload.level,
                    tags: payload.tags,
                    extra: payload.extra,
                });
            }
        );

        return listener.removeListener;
    }, []);
}
