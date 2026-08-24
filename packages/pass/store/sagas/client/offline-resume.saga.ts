import { put } from 'redux-saga/effects';

import identity from '@proton/utils/identity';

import { api } from '../../../lib/api/api';
import { isPassCryptoError } from '../../../lib/crypto/utils/errors';
import { offlineResume, startEventPolling } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { hydrate } from './hydrate.saga';

export default createRequestSaga({
    actions: offlineResume,
    call: function* ({ localID, retryable = false, silence = false }, options) {
        const auth = options.getAuthService();

        const resumed: boolean = yield auth.resumeSession(localID, { retryable, silence });
        if (!resumed) throw new Error();
        api.setResumeLock(false);

        yield hydrate(
            {
                online: true,
                merge: identity,
                onError: function* (err) {
                    if (isPassCryptoError(err)) {
                        yield auth.logout({ soft: true });
                    }
                },
            },
            options
        );

        yield put(startEventPolling());
        return true;
    },
});
