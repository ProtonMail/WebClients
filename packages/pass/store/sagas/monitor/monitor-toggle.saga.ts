import { setMonitorSettings } from '@proton/pass/lib/monitor/monitor.request';
import { monitorToggle } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: monitorToggle, call: setMonitorSettings });
