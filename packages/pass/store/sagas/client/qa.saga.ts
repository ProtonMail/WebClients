import { eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { DEFAULT_PASS_FEATURES } from '@proton/pass/constants';
import { SyncStrategy } from '@proton/pass/lib/events/types';
import type { QAEvent } from '@proton/pass/lib/qa/service';
import { QA_SERVICE } from '@proton/pass/lib/qa/service';
import { getUserFeaturesSuccess } from '@proton/pass/store/actions';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { selectFeatureFlags } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { PassFeature } from '@proton/pass/types/api/features';

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
                    yield put(getUserFeaturesSuccess('qa', { ...features, [PassFeature.PassUserEventsV1]: evt.enabled }));
                    const strategy = SyncStrategy[evt.enabled ? 'USER_EVENTS' : 'LEGACY'];
                    options.onNotification({ type: 'info', text: `Sync strategy set to ${strategy}` });
                    break;
                }
            }
        }
    }
}
