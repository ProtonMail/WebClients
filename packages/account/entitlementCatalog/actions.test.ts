import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import {
    type CataloguedPlan,
    buildOrganizationEntitlements,
    prodCatalogGrants,
} from '@proton/payments/testing/prodCatalogGrants';
import { getEntitlementsState, getSubscriptionState } from '@proton/payments/testing/redux-state';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { buildUser } from '@proton/shared/testing/buildUser';

import { entitlementsReducer } from '../entitlements';
import { organizationReducer } from '../organization';
import { subscriptionReducer } from '../subscription';
import { getModelState } from '../testing/getModelState';
import { getOrganizationState } from '../testing/redux-state';
import { userReducer } from '../user';
import { entitlementChecksForOrgAndUserThunk } from './actions';
import { entitlementCatalogReducer } from './index';

const api = jest.fn(({ url }: { url: string }) => Promise.reject(new Error(`unexpected url ${url}`)));

const setup = ({ role, subscriptionPlans }: { role: USER_ROLES; subscriptionPlans: CataloguedPlan[] }) => {
    const [first, ...others] = subscriptionPlans.map((plan) => buildSubscription(plan));
    const subscription =
        role === USER_ROLES.ADMIN_ROLE && first ? { ...first, SecondarySubscriptions: others } : ({} as Subscription);

    const { store } = getTestStore({
        reducer: {
            ...userReducer,
            ...organizationReducer,
            ...subscriptionReducer,
            ...entitlementsReducer,
            ...entitlementCatalogReducer,
        },
        preloadedState: {
            user: getModelState(buildUser({ Role: role })),
            organization: getOrganizationState({ IsSubsidiary: false } as OrganizationExtended),
            subscription: getSubscriptionState(subscription),
            entitlements: getEntitlementsState(makeEntitlements(buildOrganizationEntitlements(subscriptionPlans))),
            entitlementCatalog: getModelState(buildEntitlementCatalog(prodCatalogGrants)),
        },
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });

    return store as any;
};

describe('entitlementChecksForOrgAndUserThunk', () => {
    beforeEach(() => {
        api.mockClear();
    });

    it.each([
        { plan: PLANS.BUNDLE, isMailB2C: true, hasAllCoreProductsB2C: true, isB2B: false },
        { plan: PLANS.MAIL, isMailB2C: true, hasAllCoreProductsB2C: false, isB2B: false },
        { plan: PLANS.MAIL_PRO, isMailB2C: false, hasAllCoreProductsB2C: false, isB2B: true },
    ] as const)('answers for an admin with $plan', async ({ plan, ...expected }) => {
        const store = setup({ role: USER_ROLES.ADMIN_ROLE, subscriptionPlans: [plan] });

        const checks = await store.dispatch(entitlementChecksForOrgAndUserThunk());

        expect({
            isMailB2C: checks.isMailB2C,
            hasAllCoreProductsB2C: checks.hasAllCoreProductsB2C,
            isB2B: checks.isB2B,
        }).toEqual(expected);
        expect(api).not.toHaveBeenCalled();
    });

    it('checks every subscription of an admin with several', async () => {
        const store = setup({ role: USER_ROLES.ADMIN_ROLE, subscriptionPlans: [PLANS.PASS, PLANS.MAIL] });

        const checks = await store.dispatch(entitlementChecksForOrgAndUserThunk());

        expect(checks.isMailB2C).toBe(true);
        expect(checks.hasAllCoreProductsB2C).toBe(false);
    });

    it('answers from the organization entitlements for a member who cannot read the subscriptions', async () => {
        const store = setup({ role: USER_ROLES.MEMBER_ROLE, subscriptionPlans: [PLANS.FAMILY] });

        const checks = await store.dispatch(entitlementChecksForOrgAndUserThunk());

        expect(checks.isMailB2C).toBe(true);
        expect(checks.hasAllCoreProductsB2C).toBe(true);
    });
});
