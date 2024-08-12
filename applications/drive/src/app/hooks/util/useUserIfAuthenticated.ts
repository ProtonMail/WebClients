import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { getUser } from '@proton/shared/lib/api/user';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { User, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { sendErrorReport } from '../../utils/errorHandling';

export const useUserIfAuthenticated = (isSessionProtonUser: boolean, uid?: string): { user: UserModel | undefined } => {
    const api = useApi();
    const [user, setUser] = useState<UserModel | undefined>(undefined);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (uid && isSessionProtonUser) {
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
        };

        fetchUser();
    }, [uid, isSessionProtonUser]);

    return { user };
};
