import { createHooks } from '@proton/redux-utilities/hooks';

import { entitlementsThunk, selectEntitlements } from './index';

const hooks = createHooks(entitlementsThunk, selectEntitlements);

/**
 * Raw Redux hook — returns all entitlements and their loading state.
 *
 * For entitlement checks in UI, use `createEntitlementResolver` from `@proton/payments/core/entitlements/resolver`.
 */
export const useAllEntitlements = hooks.useValue;

/**
 * Raw Redux hook — returns a function that lazily fetches all entitlements.
 *
 * For lazy entitlement resolution, compose with `createEntitlementResolver` from `@proton/payments/core/entitlements/resolver`.
 */
export const useGetAllEntitlements = hooks.useGet;
