import { useEffect } from 'react';

import { canListenInboxDesktopHostMessages } from '@proton/shared/lib/desktop/ipcHelpers';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

export function useInboxDesktopMessageForward() {
    useEffect(() => {
        if (!canListenInboxDesktopHostMessages) {
            return;
        }

        window.ipcInboxMessageBroker!.on!('captureMessage', (payload) => {
            captureMessage(payload.message, {
                level: payload.level,
                tags: payload.tags,
                extra: payload.extra,
            });
        });
    }, []);
}
