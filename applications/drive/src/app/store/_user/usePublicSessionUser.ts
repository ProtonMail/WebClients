import { useMemo } from 'react';

import { useAuthentication } from '@proton/components/hooks';

import { usePublicSession } from '../_api';

export const usePublicSessionUser = () => {
    const auth = useAuthentication();
    const { user } = usePublicSession();
    const localID: number | undefined = useMemo(() => auth.getLocalID(), []);

    return { user, localID };
};
