import { useEffect, useRef } from 'react';

import { useApi } from '@proton/components/hooks';
import { queryUserActivePing } from '@proton/shared/lib/api/drive/user';
import { ACTIVE_PING_INTERVAL } from '@proton/shared/lib/drive/constants';

// This hook is only about ping the api to tell that a user is active
export const useActivePing = (interval: number = ACTIVE_PING_INTERVAL) => {
    const api = useApi();
    const ref = useRef<number>();

    useEffect(() => {
        if (!ref.current || new Date().getTime() - ref.current > interval) {
            void api(queryUserActivePing());
            ref.current = new Date().getTime();
        }

        const intervalFunction = setInterval(() => {
            ref.current = new Date().getTime();
            void api(queryUserActivePing());
        }, interval);

        return () => {
            clearInterval(intervalFunction);
        };
    }, [api, interval]);
};
