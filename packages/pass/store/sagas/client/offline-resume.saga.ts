import { put } from 'redux-saga/effects';

import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { offlineResume, startEventPolling } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import identity from '@proton/utils/identity';

import { hydrate } from './hydrate.saga';

export default createRequestSaga({
    actions: offlineResume,
    call: function* ({ localID, retryable = false, silence = false }, options) {
        const auth = options.getAuthService();

        const resumed: boolean = yield auth.resumeSession(localID, { retryable, silence });
        if (!resumed) throw new Error();

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
