import { serverEvent } from '../eventLoop';
import { entitlementsThunk } from './index';
import { entitlementsListener } from './listenerV5';
import { CATALOG_URL, ENTITLEMENTS_URL, setupEntitlementsStore } from './testing';

// Gives the listener middleware a chance to run its effect, so a negative assertion fails if the predicate was wrong.
const flushAsyncWork = () => new Promise((resolve) => setTimeout(resolve, 0));

const anEntitlementEvent = { OrganizationEntitlements: [] };

describe('entitlementsListener', () => {
    const setup = () => {
        const harness = setupEntitlementsStore();
        entitlementsListener(harness.startListening as any);
        return harness;
    };

    it('ignores an event that carries no entitlement changes', async () => {
        const { store, urlsCalled } = setup();
        await store.dispatch(entitlementsThunk());

        store.dispatch(serverEvent({ More: 0 } as any));
        await flushAsyncWork();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(1);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(0);
    });

    it('ignores an entitlement event before entitlements have ever been loaded', async () => {
        const { store, urlsCalled } = setup();

        store.dispatch(serverEvent(anEntitlementEvent as any));
        await flushAsyncWork();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(0);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(0);
    });

    it('refetches entitlements and the catalog on an organization entitlement event', async () => {
        const { store, urlsCalled } = setup();
        await store.dispatch(entitlementsThunk());

        store.dispatch(serverEvent(anEntitlementEvent as any));
        await flushAsyncWork();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });

    it('refetches entitlements and the catalog on a member entitlement event', async () => {
        const { store, urlsCalled } = setup();
        await store.dispatch(entitlementsThunk());

        store.dispatch(serverEvent({ MemberEntitlements: [] } as any));
        await flushAsyncWork();

        expect(urlsCalled(ENTITLEMENTS_URL)).toHaveLength(2);
        expect(urlsCalled(CATALOG_URL)).toHaveLength(1);
    });
});
