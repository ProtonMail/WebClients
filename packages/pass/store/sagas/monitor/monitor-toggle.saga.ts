import { put } from 'redux-saga/effects';

import { setMonitorSettings } from '../../../lib/monitor/monitor.request';
import type { UpdateUserMonitorStateRequest } from '../../../types';
import { getBreaches, monitorToggle } from '../../actions';
import { withRevalidate } from '../../request/enhancers';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: monitorToggle,
    call: function* (data) {
        const res: UpdateUserMonitorStateRequest = yield setMonitorSettings(data);
        yield put(withRevalidate(getBreaches.intent()));
        return res;
    },
});
