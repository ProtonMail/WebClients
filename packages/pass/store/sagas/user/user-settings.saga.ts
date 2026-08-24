import { getUserSettings as fetchUserSettings } from '../../../lib/user/user.requests';
import { getUserSettings } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({ actions: getUserSettings, call: fetchUserSettings });
