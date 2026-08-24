import { getCustomEmailBreaches } from '../../../lib/monitor/monitor.request';
import { intoFetchedBreach } from '../../../lib/monitor/monitor.utils';
import { getCustomBreach } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: getCustomBreach,
    call: async (addressId) => (await getCustomEmailBreaches(addressId)).Breaches.map(intoFetchedBreach),
});
