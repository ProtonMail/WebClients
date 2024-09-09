import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getUser } from '@proton/shared/lib/api/user';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { User, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { sendErrorReport } from '../../utils/errorHandling';

export const useUserIfAuthenticated = (
    isSessionProtonUser: boolean,
    uid?: string
): { user: UserModel | undefined; isLoading: boolean } => {
    const api = useApi();
    const [user, setUser] = useState<UserModel | undefined>(undefined);
    const [isLoading, withLoading] = useLoading(true);

    useEffect(() => {
        // If UID is not defined this means that the session is not loaded yet
        // We keep the loading status to true until then
        if (!uid) {
            return;
        }
        const fetchUser = () =>
            withLoading(async () => {
                try {
                    if (isSessionProtonUser) {
                        const response = await api<User>({
                            ...getUser(),
                            headers: {
                                ...getUIDHeaders(uid),
                            },
                        });
                        setUser(formatUser(response));
                    }
                } catch (error) {
                    sendErrorReport(error);
                }
            });

        fetchUser();
    }, [uid, isSessionProtonUser]);

    return { isLoading, user };
};
