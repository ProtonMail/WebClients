import { toggleSentinel } from '@proton/pass/lib/monitor/monitor.request';
import { sentinelToggle } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: sentinelToggle,
    call: async (value) => {
        await toggleSentinel(value);
        return value;
    },
});
