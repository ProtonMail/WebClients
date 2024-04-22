import { getCustomEmailBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { intoFetchedBreach } from '@proton/pass/lib/monitor/monitor.utils';
import { getCustomBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: getCustomBreach,
    call: async (addressId) => (await getCustomEmailBreaches(addressId)).Breaches.map(intoFetchedBreach),
});
