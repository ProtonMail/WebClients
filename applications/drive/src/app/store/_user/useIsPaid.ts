import { useEffect, useState } from 'react';

import { useGetUser } from '@proton/components';
import type { User } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { useIsPublicContext } from '../_utils/useIsPublicContext';

let isPaidCached: boolean | undefined = undefined;

// useIsPaid gets and caches in memory forever info about whether user is paid.
// In public context it assumes that user is free and must be reconsidered in the future.
export function useIsPaid() {
    const isPublicContext = useIsPublicContext();
    const getUser = useGetUser();

    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        if (isPaidCached !== undefined || isPublicContext) {
            return;
        }
        getUser().then((user: User) => {
            setIsPaid(formatUser(user).isPaid);
        });
    }, []);

    if (isPaidCached !== undefined) {
        return isPaidCached;
    }
    if (isPublicContext) {
        return false;
    }
    return isPaid;
}
