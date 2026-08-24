import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import type { AuthRouteState } from '../../components/Navigation/routing';
import type { MaybeNull } from '../../types';

export const useUserInitiatedLock = (onLock: () => void) => {
    const history = useHistory<MaybeNull<AuthRouteState>>();

    return useCallback(() => {
        history.replace({ ...history.location, state: { userInitiatedLock: true } });
        onLock();
    }, [onLock]);
};
