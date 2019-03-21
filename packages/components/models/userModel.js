import { createContext } from 'react';
import { getUser } from 'proton-shared/lib/api/user';
import {
    isPaid,
    isMember,
    hasPaidVpn,
    hasPaidMail,
    isAdmin,
    isDelinquent,
    isFree,
    isSubUser
} from 'proton-shared/lib/user/helpers';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const getInfo = (User) => {
    return {
        isAdmin: isAdmin(User),
        isMember: isMember(User),
        isFree: isFree(User),
        isPaid: isPaid(User),
        isSub: isSubUser(User),
        isDelinquent: isDelinquent(User),
        hasPaidMail: hasPaidMail(User),
        hasPaidVpn: hasPaidVpn(User)
    };
};

const transform = (User) => {
    if (!User) {
        return;
    }
    return {
        ...User,
        ...getInfo(User)
    };
};

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(getUser()).then(({ User }) => User);
    };
};

const providerValue = createModelHook({
    useAsyncFn,
    transform
});
export const UserContext = createContext();
export const UserProvider = createProvider(UserContext, providerValue);
export const useUser = createUseModelHook(UserContext);
