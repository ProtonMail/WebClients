import { useEffect, useState } from 'react';

import { useGetUser } from '@proton/components';
import type { User } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { getIsPublicContext } from '../../utils/getIsPublicContext';

let isPaidCached: boolean | undefined = undefined;

// useIsPaid gets and caches in memory forever info about whether user is paid.
// In public context it assumes that user is free and must be reconsidered in the future.
export function useIsPaid() {
    const getUser = useGetUser();
    const isPublicContext = getIsPublicContext();
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        if (isPaidCached !== undefined || isPublicContext) {
            return;
        }
        void getUser().then((user: User) => {
            setIsPaid(formatUser(user).isPaid);
        });
    }, [getUser, isPublicContext]);

    if (isPaidCached !== undefined) {
        return isPaidCached;
    }
    if (isPublicContext) {
        return false;
    }
    return isPaid;
}
