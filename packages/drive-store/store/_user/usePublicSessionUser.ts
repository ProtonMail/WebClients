import { useAuthentication } from '@proton/components';

import usePublicSession from '../_api/usePublicSession';

export const usePublicSessionUser = () => {
    const auth = useAuthentication();
    const { user } = usePublicSession();
    const UID: string = auth.getUID();

    return { user, UID };
};
