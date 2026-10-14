import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { type SubscriptionState, subscriptionReducer } from '../subscription';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { allSubscriptionsThunk, selectAllSubscriptions, toAllSubscriptions } from './index';

const paidAdmin = { Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as UserModel;

const getSubscriptionState = (value: Subscription | undefined): SubscriptionState['subscription'] => {
    const modelState = getModelState(value);
    return { ...modelState, meta: { ...modelState.meta, type: 1 } };
};

describe('toAllSubscriptions', () => {
    it('should return no subscriptions for a free subscription', () => {
        expect(toAllSubscriptions(FREE_SUBSCRIPTION as unknown as Subscription)).toEqual([]);
    });

    it('should return no subscriptions when there is no subscription', () => {
        expect(toAllSubscriptions(undefined)).toEqual([]);
    });

    it('should return the only subscription of a single-subscription user', () => {
        const mailPro = buildSubscription(PLANS.MAIL_PRO);

        expect(toAllSubscriptions(mailPro)).toEqual([{ ...mailPro, SecondarySubscriptions: undefined }]);
    });

    it('should flatten secondary subscriptions so that none of them is nested in another', () => {
        const lumo = buildSubscription(PLANS.LUMO);
        const vpn = buildSubscription(PLANS.VPN2024);
        const mailPro = buildSubscription(PLANS.MAIL_PRO, { SecondarySubscriptions: [lumo, vpn] });

        expect(toAllSubscriptions(mailPro)).toEqual([
            { ...mailPro, SecondarySubscriptions: undefined },
            { ...lumo, SecondarySubscriptions: undefined },
            { ...vpn, SecondarySubscriptions: undefined },
        ]);
    });
});

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
