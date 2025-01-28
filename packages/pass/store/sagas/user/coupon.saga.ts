import { put, select } from 'redux-saga/effects';

import { redeemCouponApi } from '@proton/pass/lib/user/user.requests';
import { getUserAccessIntent, redeemCoupon } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectUser } from '@proton/pass/store/selectors';

import { withRevalidate } from '../../request/enhancers';
import type { State } from '../../types';

export default createRequestSaga({
    actions: redeemCoupon,
    call: function* (coupon) {
        yield redeemCouponApi(coupon);

        // Sync user plan
        const state = (yield select()) as State;
        const user = selectUser(state);
        if (!user) return false;

        yield put(withRevalidate(getUserAccessIntent(user.ID)));
        return true;
    },
});
