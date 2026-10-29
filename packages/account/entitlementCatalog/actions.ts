import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

import { allSubscriptionsThunk } from '../allSubscriptions';
import { type EntitlementsState, entitlementsThunk } from '../entitlements';
import { type OrganizationState, organizationThunk } from '../organization';
import type { SubscriptionState } from '../subscription';
import { userThunk } from '../user';
import { type EntitlementCatalogState, entitlementCatalogThunk } from './index';

export const entitlementChecksForOrgAndUserThunk = (): ThunkAction<
    Promise<EntitlementChecksForOrgAndUser>,
    EntitlementsState & EntitlementCatalogState & SubscriptionState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [entitlements, subscriptions, entitlementCatalog, user, organization] = await Promise.all([
            dispatch(entitlementsThunk()),
            dispatch(allSubscriptionsThunk()),
            dispatch(entitlementCatalogThunk()),
            dispatch(userThunk()),
            dispatch(organizationThunk()),
        ]);
        return createEntitlementResolverForOrgAndUser({
            entitlementCatalog,
            entitlements,
            subscriptions,
            user,
            organization,
        });
    };
};
