import { useCallback } from 'react';

import { Member } from '@proton/shared/lib/interfaces';
import { MembersModel } from '@proton/shared/lib/models/membersModel';
import { UserModel } from '@proton/shared/lib/models/userModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const useMembers = (): [Member[], boolean, Error] => {
    const cache = useCache();
    const api = useApi();

    const miss = useCallback(() => {
        // Not using use user since it's better to read from the cache
        // It will be updated from the event manager.
        const user = cache.get(UserModel.key).value;
        if (user.isAdmin) {
            return MembersModel.get(api);
        }
        return Promise.resolve([]);
    }, [api, cache]);

    return useCachedModelResult(cache, MembersModel.key, miss);
};

export default useMembers;
