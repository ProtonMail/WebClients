import { setBreachedAliasResolved } from '@proton/pass/lib/monitor/monitor.request';
import { resolveAliasBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: resolveAliasBreach,
    call: ({ shareId, itemId }) => setBreachedAliasResolved(shareId, itemId),
});
