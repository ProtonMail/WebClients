import { useEffect } from 'react';

import { useApi } from '@proton/app-context/useApi';

import { startInboxDesktopHeartbeat } from '../desktop/heartbeat';

export const useInboxDesktopHeartbeat = () => {
    const api = useApi();

    useEffect(() => {
        return startInboxDesktopHeartbeat(api);
    }, [api]);
};
