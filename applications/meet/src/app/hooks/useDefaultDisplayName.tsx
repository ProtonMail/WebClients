import { useUser } from '@proton/account/user/hooks';

import { getEmptyParticipantName } from '../utils/getRandomParticipantName';

const useDefaultDisplayNameAuthenticated = () => {
    const [user] = useUser();
    return user?.DisplayName || user?.Name || user?.Email || '';
};

const useDefaultDisplayNameUnauthenticated = () => {
    return getEmptyParticipantName();
};

export const defaultDisplayNameHooks = {
    authenticated: useDefaultDisplayNameAuthenticated,
    unauthenticated: useDefaultDisplayNameUnauthenticated,
};
