import { useUser } from '@proton/account/user/hooks';

import { getRandomParticipantName } from '../utils/getRandomParticipantName';

const useDefaultDisplayNameAuthenticated = () => {
    const [user] = useUser();
    return user?.DisplayName || user?.Name || user?.Email || '';
};

const useDefaultDisplayNameUnauthenticated = () => {
    return getRandomParticipantName();
};

export const defaultDisplayNameHooks = {
    authenticated: useDefaultDisplayNameAuthenticated,
    unauthenticated: useDefaultDisplayNameUnauthenticated,
};
