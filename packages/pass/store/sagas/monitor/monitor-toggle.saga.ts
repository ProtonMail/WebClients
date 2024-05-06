import { put } from 'redux-saga/effects';

import { setMonitorSettings } from '@proton/pass/lib/monitor/monitor.request';
import { getBreaches, monitorToggle } from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { UpdateUserMonitorStateRequest } from '@proton/pass/types';

export default createRequestSaga({
    actions: monitorToggle,
    call: function* (data) {
        const res: UpdateUserMonitorStateRequest = yield setMonitorSettings(data);
        yield put(withRevalidate(getBreaches.intent()));
        return res;
    },
});
