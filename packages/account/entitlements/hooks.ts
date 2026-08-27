import { createHooks } from '@proton/redux-utilities/hooks';

import { entitlementsThunk, selectEntitlements } from './index';

const hooks = createHooks(entitlementsThunk, selectEntitlements);

/**
 * Raw Redux hook — returns all entitlements and their loading state.
 *
 * For most use cases, prefer the higher-level hooks in `@proton/payments-ui/entitlements/hooks`:
 * - `useEntitlements()` — returns an EntitlementResolver with reactive updates
 */
export const useAllEntitlements = hooks.useValue;

/**
 * Raw Redux hook — returns a function that lazily fetches all entitlements.
 *
 * For most use cases, prefer the higher-level hooks in `@proton/payments-ui/entitlements/hooks`:
 * - `useGetEntitlements()` — returns a lazy getter that resolves an EntitlementResolver
 */
export const useGetAllEntitlements = hooks.useGet;
