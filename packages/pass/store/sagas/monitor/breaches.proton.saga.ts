import { getBreachesForProtonAddress } from '../../../lib/monitor/monitor.request';
import { intoFetchedBreach } from '../../../lib/monitor/monitor.utils';
import { getProtonBreach } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: getProtonBreach,
    call: async (addressId) => (await getBreachesForProtonAddress(addressId)).Breaches.map(intoFetchedBreach),
});
