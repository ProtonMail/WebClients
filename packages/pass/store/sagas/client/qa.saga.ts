import { eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { PLANS } from '@proton/payments/core/constants';

import { DEFAULT_PASS_FEATURES } from '../../../constants';
import type { QAEvent } from '../../../lib/qa/service';
import { QA_SERVICE } from '../../../lib/qa/service';
import { SyncStrategy } from '../../../lib/sync/types';
import { PassFeature } from '../../../types/api/features';
import { UNIX_DAY } from '../../../utils/time/constants';
import { getEpoch } from '../../../utils/time/epoch';
import { getUserAccessIntent, getUserAccessSuccess, setUserFeatureFlags } from '../../actions';
import { userAccessRequest } from '../../actions/requests';
import { getPaymentNudgePaymentMethods } from '../../payment-nudge/actions';
import type { FeatureFlagState, UserState } from '../../reducers';
import { requestInvalidate } from '../../request/actions';
import { withRevalidate } from '../../request/enhancers';
import { selectFeatureFlags, selectUserState } from '../../selectors';
import type { RootSagaOptions } from '../../types';

/** Fakes the API responses the payment nudge gate reads, so the spotlight can be
 * exercised without provisioning a B2B trial account. The gate, rule and view all
 * run for real. `isAdmin` and `isPaid` come off the user object and are not faked
 * here: run this on an admin account with a paid plan.
 *
 * Disabling refetches the real plan, since the faked one is written to cache. */
function* paymentMethodNudge(enabled: boolean, userID: string) {
    if (!enabled) {
        yield put(requestInvalidate(getPaymentNudgePaymentMethods.requestID()));
        yield put(withRevalidate(getUserAccessIntent(userID)));
        return;
    }

    const { plan, pendingInvites, waitingNewUserInvites, monitor, userData }: UserState = yield select(selectUserState);

    if (!plan) return;

    yield put(
        getUserAccessSuccess(userAccessRequest(userID), {
            plan: {
                ...plan,
                InternalName: PLANS.PASS_BUSINESS,
                ManageSubscription: true,
                TrialEnd: getEpoch() + 14 * UNIX_DAY,
            },
            pendingInvites,
            waitingNewUserInvites,
            monitor,
            userData,
        })
    );

    yield put(getPaymentNudgePaymentMethods.success(getPaymentNudgePaymentMethods.requestID(), []));
}

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

                case 'payment_method_nudge': {
                    const userID = options.getAuthStore().getUserID()!;
                    yield* paymentMethodNudge(evt.enabled, userID);
                    options.onNotification({
                        type: 'info',
                        text: `Payment method nudge ${evt.enabled ? 'faked' : 'cleared'}`,
                    });
                    break;
                }
            }
        }
    }
}
