import { useEffect, useState } from 'react';

import { useGetUser } from '@proton/account/user/hooks';
import type { User } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { getIsPublicContext } from '../../utils/getIsPublicContext';

export function useIsPaid() {
    const getUser = useGetUser();
    const isPublicContext = getIsPublicContext();
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        if (isPublicContext) {
            return;
        }
        void getUser().then((user: User) => {
            setIsPaid(formatUser(user).isPaid);
        });
    }, [getUser, isPublicContext]);

    if (isPublicContext) {
        return false;
    }
    return isPaid;
}
