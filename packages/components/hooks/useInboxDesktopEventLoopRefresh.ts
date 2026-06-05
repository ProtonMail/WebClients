import { useEffect } from 'react';

import { addIPCHostUpdateListener, canListenInboxDesktopHostMessages } from '@proton/shared/lib/desktop/ipcHelpers';

import useEventManager from './useEventManager';

export const useInboxDesktopEventLoopRefresh = () => {
    const { call } = useEventManager();

    useEffect(() => {
        if (!canListenInboxDesktopHostMessages) {
            return;
        }

        const listener = addIPCHostUpdateListener('refreshEventLoop', () => {
            void call();
        });

        return () => {
            listener.removeListener();
        };
    }, [call]);
};
