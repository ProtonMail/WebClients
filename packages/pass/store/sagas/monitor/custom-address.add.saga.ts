import { monitorCustomEmail } from '../../../lib/monitor/monitor.request';
import { addCustomAddress } from '../../actions/creators/monitor';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: addCustomAddress,
    call: (Email) => monitorCustomEmail({ Email }),
});
