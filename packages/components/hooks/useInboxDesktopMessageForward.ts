import { useEffect } from 'react';

import { addIPCHostUpdateListener, canListenInboxDesktopHostMessages } from '@proton/shared/lib/desktop/ipcHelpers';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

export function useInboxDesktopMessageForward() {
    useEffect(() => {
        if (!canListenInboxDesktopHostMessages) {
            return;
        }

        const listener = addIPCHostUpdateListener('captureMessage', (payload) => {
            captureMessage(payload.message, {
                level: payload.level,
                tags: payload.tags,
                extra: payload.extra,
            });
        });

        return listener.removeListener;
    }, []);
}
