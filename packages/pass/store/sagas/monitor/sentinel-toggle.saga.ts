import { toggleSentinel } from '../../../lib/monitor/monitor.request';
import { sentinelToggle } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: sentinelToggle,
    call: async (value) => {
        await toggleSentinel(value);
        return value;
    },
});
