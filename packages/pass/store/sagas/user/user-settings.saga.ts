import { getUserSettings as fetchUserSettings } from '@proton/pass/lib/user/user.requests';
import { getUserSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: getUserSettings, call: fetchUserSettings });
