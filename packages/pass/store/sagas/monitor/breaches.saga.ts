import { getAllBreaches } from '../../../lib/monitor/monitor.request';
import { getBreaches } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({ actions: getBreaches, call: getAllBreaches });
