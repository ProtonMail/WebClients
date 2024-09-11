import { useMemo } from 'react';

import { getLastPersistedLocalID } from '../../utils/lastActivePersistedUserSession';
import { usePublicSession } from '../_api';

export const usePublicSessionUser = () => {
    const { user } = usePublicSession();
    const localID = useMemo(() => getLastPersistedLocalID(), []);

    return { user, localID: localID ?? undefined };
};
