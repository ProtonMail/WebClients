import { getNotifications, updateNotificationState } from '@proton/pass/lib/notifications/notifications.requests';
import { getInAppNotifications, updateInAppNotificationState } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const get = createRequestSaga({
    actions: getInAppNotifications,
    call: getNotifications,
});

const update = createRequestSaga({
    actions: updateInAppNotificationState,
    call: updateNotificationState,
});

export default [get, update];
