import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces';

import type { CoreEventLoopV6RequiredState } from '../coreEventLoop/interface';
import { entitlementsLoop } from './eventLoopV6';
import { entitlementsThunk } from './index';
import { CATALOG_URL, ENTITLEMENTS_URL, asEntitlements, setupEntitlementsStore } from './testing';

const anEntitlementEvent = { OrganizationEntitlements: [] } as Partial<CoreEventV6Response>;

describe('entitlementsLoop', () => {
    const setup = () => {
        const harness = setupEntitlementsStore();

        const fire = (event: Partial<CoreEventV6Response>) =>
            entitlementsLoop({
                event: event as CoreEventV6Response,
                state: harness.store.getState() as unknown as CoreEventLoopV6RequiredState,
                dispatch: harness.store.dispatch,
                api: harness.api as unknown as Api,
            });

        return { ...harness, fire };
    };

    it('ignores an event that carries no entitlement changes', async () => {
        const { store, urlsCalled, fire } = setup();
        await store.dispatch(entitlementsThunk());

        expect(fire({})).toBeUndefined();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(1);
    });

    it('ignores an entitlement event before entitlements have ever been loaded', () => {
        const { urlsCalled, fire } = setup();

        expect(fire(anEntitlementEvent)).toBeUndefined();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(0);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(0);
    });

    it('refetches entitlements and the catalog on an organization entitlement event', async () => {
        const { store, urlsCalled, fire } = setup();
        await store.dispatch(entitlementsThunk());

        await fire(anEntitlementEvent);

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });

    it('refetches entitlements and the catalog on a member entitlement event', async () => {
        const { store, setServerEntitlements, urlsCalled, fire } = setup();
        await store.dispatch(entitlementsThunk());
        setServerEntitlements(asEntitlements([]));

        await fire({ MemberEntitlements: [] } as Partial<CoreEventV6Response>);

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });
});
