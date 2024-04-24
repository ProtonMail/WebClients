import { setBreachedCustomEmailResolved } from '@proton/pass/lib/monitor/monitor.request';
import { resolveCustomBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: resolveCustomBreach, call: setBreachedCustomEmailResolved });
