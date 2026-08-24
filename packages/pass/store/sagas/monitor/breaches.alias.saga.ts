import { getAliasBreaches } from '../../../lib/monitor/monitor.request';
import { intoFetchedBreach } from '../../../lib/monitor/monitor.utils';
import { getAliasBreach } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: getAliasBreach,
    call: async ({ shareId, itemId }) => (await getAliasBreaches(shareId, itemId)).Breaches.map(intoFetchedBreach),
});
