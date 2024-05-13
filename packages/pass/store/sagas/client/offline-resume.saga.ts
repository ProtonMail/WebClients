import { takeLeading } from 'redux-saga/effects';

import { isOnline } from '@proton/pass/lib/api/utils';
import { offlineResume } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import identity from '@proton/utils/identity';

import { hydrate } from './hydrate.saga';

function* offlineResumeWorker(options: RootSagaOptions, { payload }: ReturnType<typeof offlineResume>) {
    const auth = options.getAuthService();
    const { localID } = payload;

    if (isOnline()) {
        try {
            if ((yield auth.resumeSession(localID, { retryable: false })) as boolean) {
                yield hydrate(
                    {
                        allowFailure: false,
                        merge: identity,
                        onError: function* () {
                            yield auth.logout({ soft: true });
                        },
                    },
                    options
                );
            }
        } catch {}
    }
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineResume.match, offlineResumeWorker, options);
}
