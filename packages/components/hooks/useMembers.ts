import { useCallback } from 'react';
import { MembersModel } from 'proton-shared/lib/models/membersModel';
import { Member } from 'proton-shared/lib/interfaces';
import { UserModel } from 'proton-shared/lib/models/userModel';

import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

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
