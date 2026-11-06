import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { type SubscriptionState, subscriptionReducer } from '../subscription';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { allSubscriptionsThunk, selectAllSubscriptions } from './index';

const paidAdmin = { Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as UserModel;

const getSubscriptionState = (value: Subscription | undefined): SubscriptionState['subscription'] => {
    const modelState = getModelState(value);
    return { ...modelState, meta: { ...modelState.meta, type: 1 } };
};

describe('allSubscriptions model', () => {
    const apiMock = jest.fn();

    beforeEach(() => {
        apiMock.mockReset();
    });

    const setup = (subscriptionState: SubscriptionState['subscription']) => {
        return getTestStore({
            reducer: { ...userReducer, ...subscriptionReducer },
            preloadedState: {
                user: getModelState(paidAdmin),
                subscription: subscriptionState,
            },
            extraThunkArguments: { api: apiMock } as unknown as ProtonThunkArguments,
        });
    };

    it('should have no value while the legacy subscription is not loaded', () => {
        const { store } = setup(getSubscriptionState(undefined));

        expect(selectAllSubscriptions(store.getState()).value).toBeUndefined();
    });

    it('should return the same list reference while the legacy subscription is unchanged', () => {
        const lumo = buildSubscription(PLANS.LUMO);
        const mailPro = buildSubscription(PLANS.MAIL_PRO, { SecondarySubscriptions: [lumo] });
        const { store } = setup(getSubscriptionState(mailPro));

        const first = selectAllSubscriptions(store.getState()).value;
        const second = selectAllSubscriptions(store.getState()).value;

        expect(first).toEqual([
            { ...mailPro, SecondarySubscriptions: undefined },
            { ...lumo, SecondarySubscriptions: undefined },
        ]);
        expect(second).toBe(first);
    });

    it('should resolve to the cached list without a request', async () => {
        const mailPro = buildSubscription(PLANS.MAIL_PRO);
        const { store } = setup(getSubscriptionState(mailPro));

        const result = await store.dispatch(allSubscriptionsThunk());

        expect(apiMock).not.toHaveBeenCalled();
        expect(result).toEqual([{ ...mailPro, SecondarySubscriptions: undefined }]);
    });

    it('should refetch the legacy subscription when the cache is bypassed', async () => {
        const cached = buildSubscription(PLANS.MAIL_PRO);
        const fresh = buildSubscription(PLANS.BUNDLE_PRO_2024);
        apiMock.mockResolvedValue({ Subscription: fresh, UpcomingSubscription: undefined });
        const { store } = setup(getSubscriptionState(cached));

        const result = await store.dispatch(allSubscriptionsThunk({ cache: CacheType.None }));

        expect(apiMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'payments/v4/subscription' }));
        expect(result).toEqual([{ ...fresh, SecondarySubscriptions: undefined, UpcomingSubscription: undefined }]);
        expect(selectAllSubscriptions(store.getState()).value).toEqual(result);
    });
});
