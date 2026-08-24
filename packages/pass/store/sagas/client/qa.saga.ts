import { eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { DEFAULT_PASS_FEATURES } from '../../../constants';
import type { QAEvent } from '../../../lib/qa/service';
import { QA_SERVICE } from '../../../lib/qa/service';
import { SyncStrategy } from '../../../lib/sync/types';
import { PassFeature } from '../../../types/api/features';
import { setUserFeatureFlags } from '../../actions';
import type { FeatureFlagState } from '../../reducers';
import { selectFeatureFlags } from '../../selectors';
import type { RootSagaOptions } from '../../types';

/** Dev-only saga: allows toggling QA scenarios from the browser console. */
export default function* qa(options: RootSagaOptions) {
    if (ENV === 'development') {
        const channel = eventChannel<QAEvent>((emit) => {
            const unsub = QA_SERVICE?.subscribe(emit);
            return () => unsub?.();
        });

        while (true) {
            const evt: QAEvent = yield take(channel);
            switch (evt.type) {
                case 'sync_strategy_v2': {
                    const features: FeatureFlagState = (yield select(selectFeatureFlags)) ?? DEFAULT_PASS_FEATURES;
                    yield put(setUserFeatureFlags({ ...features, [PassFeature.PassUserEventsV1]: evt.enabled }));
                    const strategy = SyncStrategy[evt.enabled ? 'USER_EVENTS' : 'LEGACY'];
                    options.onNotification({ type: 'info', text: `Sync strategy set to ${strategy}` });
                    break;
                }
            }
        }
    }
}
