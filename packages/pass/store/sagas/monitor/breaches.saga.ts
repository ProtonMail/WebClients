import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { getBreaches } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: getBreaches, call: getAllBreaches });
