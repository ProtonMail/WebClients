import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Api } from '@proton/shared/lib/interfaces';

import { entitlementCatalogThunk } from '../entitlementCatalog';
import { entitlementsThunk } from './index';
import { refetchEntitlementsAndCatalog } from './refetchEntitlementsAndCatalog';
import {
    CATALOG_URL,
    ENTITLEMENTS_URL,
    asEntitlements,
    businessGranted,
    entitlement,
    setupEntitlementsStore,
} from './testing';

describe('refetchEntitlementsAndCatalog', () => {
    const setup = () => {
        const harness = setupEntitlementsStore();

        const refetch = () =>
            refetchEntitlementsAndCatalog({
                dispatch: harness.store.dispatch,
                api: harness.api as unknown as Api,
            });

        return { ...harness, refetch };
    };

    it('refetches the catalog when a grant is lost', async () => {
        const { store, setServerEntitlements, urlsCalled, refetch } = setup();
        await store.dispatch(entitlementsThunk());

        const revoked = asEntitlements([]);
        setServerEntitlements(revoked);

        await expect(refetch()).resolves.toEqual(revoked);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });

    it('refetches the catalog when an entitlement is added', async () => {
        const { store, setServerEntitlements, urlsCalled, refetch } = setup();
        await store.dispatch(entitlementsThunk());

        const grown = asEntitlements([
            entitlement(EntitlementName.Business, 1),
            entitlement(EntitlementName.Sentinel, 1),
        ]);
        setServerEntitlements(grown);

        await expect(refetch()).resolves.toEqual(grown);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
    });

    it('refetches the catalog even when nothing changed', async () => {
        const { store, urlsCalled, refetch } = setup();
        await store.dispatch(entitlementsThunk());

        await expect(refetch()).resolves.toEqual(businessGranted);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });

    it('forces both refetches past their caches', async () => {
        const { store, setServerEntitlements, urlsCalled, refetch } = setup();
        await store.dispatch(entitlementsThunk());
        await store.dispatch(entitlementCatalogThunk());
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);

        const revoked = asEntitlements([]);
        setServerEntitlements(revoked);
        await refetch();

        expect(urlsCalled(CATALOG_URL)).toHaveLength(2);
        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
    });
});
