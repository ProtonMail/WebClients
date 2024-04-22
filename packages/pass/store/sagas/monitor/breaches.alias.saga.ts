import { getAliasBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { intoFetchedBreach } from '@proton/pass/lib/monitor/monitor.utils';
import { getAliasBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: getAliasBreach,
    call: async ({ shareId, itemId }) => (await getAliasBreaches(shareId, itemId)).Breaches.map(intoFetchedBreach),
});
