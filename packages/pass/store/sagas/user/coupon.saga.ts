import { put, select } from 'redux-saga/effects';

import type { User } from '@proton/shared/lib/interfaces/User';

import { redeemCouponApi } from '../../../lib/user/user.requests';
import { redeemCoupon } from '../../actions/creators/settings';
import { getUserAccessIntent } from '../../actions/creators/user';
import { withRevalidate } from '../../request/enhancers';
import { createRequestSaga } from '../../request/sagas';
import { selectUser } from '../../selectors/user';

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
