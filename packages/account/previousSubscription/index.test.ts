import { fetchPreviousSubscription } from '@proton/payments/core/api/api';
import { PLANS } from '@proton/payments/core/constants';
import type { PreviousSubscription } from '@proton/payments/core/interface';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { getModelState } from '../test';
import { userReducer } from '../user';
import {
    defaultPreviousSubscriptionValue,
    previousSubscriptionReducer,
    previousSubscriptionThunk,
    selectPreviousSubscription,
} from './index';

jest.mock('@proton/payments/core/api/api', () => ({
    fetchPreviousSubscription: jest.fn(),
}));

const fetchPreviousSubscriptionMock = fetchPreviousSubscription as jest.MockedFunction<
    typeof fetchPreviousSubscription
>;

const freeUser = { isPaid: false, Subscribed: 0 } as UserModel;
const paidUser = { isPaid: true, Subscribed: 1 } as UserModel;

const mappedSubscription: PreviousSubscription = {
    cycle: 12,
    currency: 'USD',
    periodStart: 1,
    periodEnd: 2,
    createTime: 0,
    cancelTime: 3,
    couponCode: null,
    external: SubscriptionPlatform.Default,
    isTrial: false,
    plans: { [PLANS.MAIL]: 1 },
};

const setup = (user: UserModel) => {
    const extraThunkArguments = {
        api: jest.fn(),
    } as unknown as ProtonThunkArguments;

    return getTestStore({
        reducer: { ...userReducer, ...previousSubscriptionReducer },
        preloadedState: { user: getModelState(user) },
        extraThunkArguments,
    });
};

describe('previousSubscription thunk', () => {
    beforeEach(() => {
        fetchPreviousSubscriptionMock.mockReset();
    });

    it('skips the API for paid users and returns the default value', async () => {
        const { store } = setup(paidUser);

        const result = await store.dispatch(previousSubscriptionThunk());

        expect(fetchPreviousSubscriptionMock).not.toHaveBeenCalled();
        expect(result).toEqual(defaultPreviousSubscriptionValue);
        expect(selectPreviousSubscription(store.getState())).toMatchObject({
            value: defaultPreviousSubscriptionValue,
        });
    });

    it('returns hasHadSubscription: true with the mapped subscription for free users with a previous subscription', async () => {
        fetchPreviousSubscriptionMock.mockResolvedValue(mappedSubscription);
        const { store } = setup(freeUser);

        const result = await store.dispatch(previousSubscriptionThunk());

        expect(fetchPreviousSubscriptionMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            hasHadSubscription: true,
            previousSubscription: mappedSubscription,
        });
    });

    it('returns the default value for free users when the API returns null', async () => {
        fetchPreviousSubscriptionMock.mockResolvedValue(null);
        const { store } = setup(freeUser);

        const result = await store.dispatch(previousSubscriptionThunk());

        expect(result).toEqual(defaultPreviousSubscriptionValue);
    });

    it('swallows API errors and returns the default value', async () => {
        fetchPreviousSubscriptionMock.mockRejectedValue(new Error('boom'));
        const { store } = setup(freeUser);

        await expect(store.dispatch(previousSubscriptionThunk())).resolves.toEqual(defaultPreviousSubscriptionValue);
    });
});
