import { IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { IncomingAddressForwardingModel } from '@proton/shared/lib/models/incomingAddressForwardingModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const useIncomingAddressForwarding = (): [IncomingAddressForwarding[], boolean, Error] => {
    const cache = useCache();
    const api = useApi();
    const miss = () => IncomingAddressForwardingModel.get(api);
    return useCachedModelResult(cache, IncomingAddressForwardingModel.key, miss);
};

export default useIncomingAddressForwarding;
