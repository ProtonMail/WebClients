import { getBreachesForProtonAddress } from '@proton/pass/lib/monitor/monitor.request';
import { intoFetchedBreach } from '@proton/pass/lib/monitor/monitor.utils';
import { getProtonBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: getProtonBreach,
    call: async (addressId) => (await getBreachesForProtonAddress(addressId)).Breaches.map(intoFetchedBreach),
});
