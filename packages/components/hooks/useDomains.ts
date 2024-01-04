import { Domain, UserModel as tsUserModel } from '@proton/shared/lib/interfaces';
import { UserModel } from '@proton/shared/lib/models';
import { DomainsModel } from '@proton/shared/lib/models/domainsModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const useDomains = (): [Domain[], boolean, Error] => {
    const cache = useCache();
    const api = useApi();

    const miss = () => {
        const user = cache.get(UserModel.key).value as tsUserModel;
        if (!user.isPaid) {
            return Promise.resolve([]);
        }

        return DomainsModel.get(api);
    };

    return useCachedModelResult(cache, DomainsModel.key, miss);
};

export default useDomains;
