import type { ProtonDispatch } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import type { Api } from '@proton/shared/lib/interfaces';

import { entitlementCatalogThunk } from '../entitlementCatalog';
import { entitlementsThunk } from './index';

/**
 * Refetches the entitlements and the catalog in response to an entitlements event.
 *
 * The catalog describes what each plan grants, and it is cached for a day. An entitlements event is the one moment we
 * know the user's entitlements moved, so it is also the moment the cached catalog can no longer be trusted — whatever
 * changed the entitlements may have changed the plan behind them.
 */
export const refetchEntitlementsAndCatalog = async ({ dispatch, api }: { dispatch: ProtonDispatch<any>; api: Api }) => {
    const [entitlements] = await Promise.all([
        dispatch(entitlementsThunk({ api, cache: CacheType.None })),
        dispatch(entitlementCatalogThunk({ api, cache: CacheType.None })),
    ]);

    return entitlements;
};
