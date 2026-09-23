import { createSelector } from '@reduxjs/toolkit';

import type { SavedPaymentMethod } from '@proton/payments/core/interface';

import type { Maybe } from '../../types';
import { selectRequest } from '../request/selectors';
import { selectUser, selectUserPlan } from '../selectors/user';
import type { State } from '../types';
import { getPaymentNudgePaymentMethods } from './actions';
import { canQueryPaymentNudge, hasNoPaymentMethod } from './gate';

const selectPaymentMethods = (state: State): Maybe<SavedPaymentMethod[]> => {
    const request = selectRequest(getPaymentNudgePaymentMethods.requestID())(state);
    return request?.status === 'success' ? (request.data as Maybe<SavedPaymentMethod[]>) : undefined;
};

/** Whether the local plan warrants looking up payment methods at all. */
export const selectCanQueryPaymentNudge = createSelector([selectUserPlan, selectUser], canQueryPaymentNudge);

export const selectPaymentNudgeEligible = createSelector(
    [selectCanQueryPaymentNudge, selectPaymentMethods],
    (canQuery, paymentMethods) => canQuery && hasNoPaymentMethod(paymentMethods)
);
