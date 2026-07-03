import { put, select } from 'redux-saga/effects';

import { redeemCouponApi } from '@proton/pass/lib/user/user.requests';
import { getUserAccessIntent, redeemCoupon } from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectUser } from '@proton/pass/store/selectors';
import type { User } from '@proton/shared/lib/interfaces';

export default createRequestSaga({
    actions: redeemCoupon,
    call: function* (coupon) {
        yield redeemCouponApi(coupon);

        const user: User = yield select(selectUser);
        if (!user) return false;

        yield put(withRevalidate(getUserAccessIntent(user.ID)));
        return true;
    },
});
