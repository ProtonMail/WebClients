import { OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { OutgoingAddressForwardingModel } from '@proton/shared/lib/models/outgoingAddressForwardingModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const useOutgoingAddressForwardings = (): [OutgoingAddressForwarding[], boolean, Error] => {
    const cache = useCache();
    const api = useApi();
    const miss = () => OutgoingAddressForwardingModel.get(api);

    return useCachedModelResult(cache, OutgoingAddressForwardingModel.key, miss);
};

export default useOutgoingAddressForwardings;
