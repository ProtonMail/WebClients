import { getAliasOptions } from '@proton/pass/lib/alias/alias.requests';
import { requestAliasOptions } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: requestAliasOptions, call: getAliasOptions });
