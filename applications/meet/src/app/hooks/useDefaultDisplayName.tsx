import { useUser } from '@proton/account/user/hooks';

import { getRandomParticipantName } from '../utils/getRandomParticipantName';

export function useDefaultDisplayName() {
    let displayName: string | undefined;

    try {
        const [user] = useUser();
        displayName = user?.DisplayName || user?.Name || user?.Email || '';
    } catch {
        displayName = undefined;
    }

    return displayName || '';
}

const useDefaultDisplayNameAuthenticated = () => {
    const [user] = useUser();
    return user?.Name || '';
};

const useDefaultDisplayNameUnauthenticated = () => {
    return getRandomParticipantName();
};

export const defaultDisplayNameHooks = {
    authenticated: useDefaultDisplayNameAuthenticated,
    unauthenticated: useDefaultDisplayNameUnauthenticated,
};
