import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import {
    type Entitlement,
    EntitlementScope,
    EntitlementType,
    type Entitlements,
} from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { entitlementCatalogReducer } from '../entitlementCatalog';
import { getModelState } from '../tests';
import { userReducer } from '../user';
import { entitlementsReducer } from './index';

export const ENTITLEMENTS_URL = 'core/v5/entitlements';
export const CATALOG_URL = 'payments/v6/plans/entitlements';

const emptyCatalog = { Plans: [], Addons: [] };

export const entitlement = (name: EntitlementName, Quantity: number): Entitlement => ({
    Name: name,
    Quantity,
    Type: EntitlementType.Value,
    Scope: EntitlementScope.Organization,
});

export const asEntitlements = (org: Entitlement[], member: Entitlement[] = []): Entitlements => ({
    UserEntitlements: [],
    OrganizationEntitlements: org,
    MemberEntitlements: member,
});

export const businessGranted = asEntitlements([entitlement(EntitlementName.Business, 1)]);

/**
 * Store wired with the slices the entitlement event handlers touch, plus an api stub that answers the entitlements and
 * catalog endpoints separately so tests can assert which of the two was refetched.
 */
export const setupEntitlementsStore = (initialServerEntitlements: Entitlements = businessGranted) => {
    let serverEntitlements = initialServerEntitlements;

    const api = jest.fn().mockImplementation(({ url }: { url: string }) => {
        if (url === ENTITLEMENTS_URL) {
            return Promise.resolve(serverEntitlements);
        }
        if (url === CATALOG_URL) {
            return Promise.resolve(emptyCatalog);
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
    });

    const { store, startListening } = getTestStore({
        reducer: { ...userReducer, ...entitlementsReducer, ...entitlementCatalogReducer },
        preloadedState: { user: getModelState({ Subscribed: 1 } as UserModel) },
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });

    return {
        store,
        startListening,
        api,
        setServerEntitlements: (next: Entitlements) => {
            serverEntitlements = next;
        },
        urlsCalled: (url: string) =>
            api.mock.calls.map(([request]: [{ url: string }]) => request.url).filter((called) => called === url),
    };
};
