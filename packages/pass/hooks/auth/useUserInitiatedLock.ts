import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import type { AuthRouteState } from '@proton/pass/components/Navigation/routing';
import type { MaybeNull } from '@proton/pass/types';

export const useUserInitiatedLock = (onLock: () => void) => {
    const history = useHistory<MaybeNull<AuthRouteState>>();

    return useCallback(() => {
        history.replace({ ...history.location, state: { userInitiatedLock: true } });
        onLock();
    }, [onLock]);
};
