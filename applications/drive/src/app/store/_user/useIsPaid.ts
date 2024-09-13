import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useGetUser } from '@proton/components';
import { formatUser } from '@proton/shared/lib/user/helpers';
import type { User } from '@proton/shared/lib/interfaces';

let isPaidCached: boolean | undefined = undefined;

// useIsPaid gets and caches in memory forever info about whether user is paid.
// In public context it assumes that user is free and must be reconsidered in the future.
export function useIsPaid() {
    const getUser = useGetUser();
    const { pathname } = useLocation();
    const isPublicContext = pathname.startsWith('/urls');

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
