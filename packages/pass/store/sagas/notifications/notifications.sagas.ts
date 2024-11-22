import { getNotifications } from '@proton/pass/lib/notifications/notifications.requests';
import { getInAppNotifications } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const get = createRequestSaga({ actions: getInAppNotifications, call: getNotifications });

export default [get];
