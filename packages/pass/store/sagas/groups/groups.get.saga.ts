import { call, put, select, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { getGroup as fetchGroup } from '@proton/pass/lib/groups/groups.requests';
import type { Group } from '@proton/pass/lib/groups/groups.types';
import { getGroup } from '@proton/pass/store/actions/creators/groups';
import { selectFeatureFlag } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';

function* getGroupWorker({ meta, payload }: ReturnType<typeof getGroup.intent>) {
    try {
        const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassGroupInvitesV1));
        if (!enabled) throw {};

        const group: Group = yield call(fetchGroup, payload);
        PassCrypto.setGroup(group);

        yield put(getGroup.success(meta.request.id, group));
    } catch (error) {
        yield put(getGroup.failure(meta.request.id, error));
    }
}

/** FIXME: we could use a requestSaga factory when
 * the `take` type is parametrized*/
export default function* watcher() {
    yield takeEvery(getGroup.intent.match, getGroupWorker);
}
