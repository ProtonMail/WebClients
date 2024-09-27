import { useAuthentication } from '@proton/components';

import { usePublicSession } from '../_api';

export const usePublicSessionUser = () => {
    const auth = useAuthentication();
    const { user } = usePublicSession();
    const localID: number | undefined = auth.getLocalID();
    const UID: string = auth.getUID();

    return { user, localID, UID };
};
