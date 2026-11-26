import { getNotifications, updateNotificationState } from '../../../lib/notifications/notifications.requests';
import { getInAppNotifications, updateInAppNotificationState } from '../../notifications/in-app/actions';
import { createRequestSaga } from '../../request/sagas';

const get = createRequestSaga({
    actions: getInAppNotifications,
    call: getNotifications,
});

const update = createRequestSaga({
    actions: updateInAppNotificationState,
    call: updateNotificationState,
});

export default [get, update];
