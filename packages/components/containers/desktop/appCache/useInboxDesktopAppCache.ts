import { useEffect } from 'react';

import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import useFlag from '@proton/unleash/useFlag';

export function useInboxDesktopAppCache() {
    const disabled = useFlag('InboxDesktopAppSessionCacheDisabled');

    useEffect(() => {
        invokeInboxDesktopIPC({ type: 'toggleAppCache', payload: !disabled });
    }, [disabled]);
}
