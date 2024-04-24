import { setBreachedProtonAddressResolved } from '@proton/pass/lib/monitor/monitor.request';
import { resolveProtonBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: resolveProtonBreach, call: setBreachedProtonAddressResolved });
