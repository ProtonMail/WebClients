import { createLocation } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import type { ListSettleOutcome } from './navigation';
import { waitForListSettled } from './navigation';
import { fakeStore, locationFor, settledView } from './navigation.test.helpers';

/** Whether the wait has already produced an outcome, without sitting out the settle timeout. Racing a single
 *  microtask turn would report "not settled" even for a wait that resolves on its first synchronous read,
 *  since `await` costs the async function a turn. A rejection is rethrown rather than read as "not settled",
 *  which would silently pass every assertion below. */
const hasSettled = async (promise: Promise<ListSettleOutcome>) => {
    let resolved = false;
    let rejection: unknown;
    void promise.then(
        () => {
            resolved = true;
        },
        (error) => {
            rejection = error;
        }
    );

    for (let turn = 0; turn < 5; turn++) {
        await Promise.resolve();
    }

    if (rejection !== undefined) {
        throw rejection;
    }

    return resolved;
};

const settled = { settled: true, usedEncryptedSearch: false };

describe('waitForListSettled', () => {
    const inbox = MAILBOX_LABEL_IDS.INBOX;
    const allMail = MAILBOX_LABEL_IDS.ALL_MAIL;

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('resolves immediately when the list is already settled on the expected location', async () => {
        const { store } = fakeStore(settledView({ labelID: inbox }));

        await expect(waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) })).resolves.toEqual(
            settled
        );
    });

    it('resolves once the expected location settles, and unsubscribes', async () => {
        const { store, change, listenerCount } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: inbox }));

        await expect(wait).resolves.toEqual(settled);
        expect(listenerCount()).toBe(0);
    });

    it('ignores a settle on a DIFFERENT location than the one navigated to', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        change(settledView({ labelID: MAILBOX_LABEL_IDS.ARCHIVE }));

        expect(await hasSettled(wait)).toBe(false);
    });

    it('requires search to be CLEARED for a plain open', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail) });

        change(settledView({ labelID: allMail, hash: 'keyword=hotel' }));
        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: allMail }));
        await expect(wait).resolves.toEqual(settled);
    });

    it('waits for the REQUESTED query, not merely any search', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'keyword=hotel') });

        change(settledView({ labelID: allMail, hash: 'keyword=invoice' }));
        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: allMail, hash: 'keyword=hotel' }));
        await expect(wait).resolves.toEqual(settled);
    });

    // The stale-rows case: same label, same (empty) query, so only the filter tells the two views apart.
    it('waits for the REQUESTED filter, so a filter-only navigation cannot read the unfiltered page', async () => {
        const { store, change } = fakeStore(settledView({ labelID: allMail }));
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'filter=unread') });

        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: allMail, hash: 'filter=unread' }));
        await expect(wait).resolves.toEqual(settled);
    });

    it('waits for the REQUESTED sort and date bounds', async () => {
        const { store, change } = fakeStore(settledView({ labelID: allMail, hash: 'keyword=hotel' }));
        const wait = waitForListSettled(store, {
            labelID: allMail,
            location: locationFor(allMail, 'keyword=hotel&sort=-size&begin=1784073600'),
        });

        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: allMail, hash: 'keyword=hotel&sort=-size' }));
        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: allMail, hash: 'keyword=hotel&sort=-size&begin=1784073600' }));
        await expect(wait).resolves.toEqual(settled);
    });

    // Why ES progress is mirrored into the store: each batch clears the loading flag, so without this the
    // wait hands back a PARTIAL page as if it were final.
    it('does not settle a search while an Encrypted Search run is still in flight', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'keyword=hotel') });

        change({ ...settledView({ labelID: allMail, hash: 'keyword=hotel' }), pendingESSearches: 1 });
        expect(await hasSettled(wait)).toBe(false);

        change({ pendingESSearches: 0, usedEncryptedSearch: true });
        await expect(wait).resolves.toEqual({ settled: true, usedEncryptedSearch: true });
    });

    // The counter is global, so gating a plain open on it would stall the read behind a search the user
    // started in the search bar — one this navigation cleared on its way past.
    it('settles a plain open even while someone else’s Encrypted Search runs', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        change({ ...settledView({ labelID: inbox }), pendingESSearches: 1 });

        await expect(wait).resolves.toEqual(settled);
    });

    // The flag is global and only a load for the current context clears it, so a plain open landing on
    // cached rows would otherwise inherit the last search's `true` and claim bodies were searched.
    it('does not report Encrypted Search for a plain open, whatever the store still holds', async () => {
        const { store } = fakeStore({ ...settledView({ labelID: inbox }), usedEncryptedSearch: true });

        await expect(waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) })).resolves.toEqual(
            settled
        );
    });

    it('does not report Encrypted Search for a search that timed out', async () => {
        const { store } = fakeStore({ usedEncryptedSearch: true });
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'keyword=hotel') });

        jest.advanceTimersByTime(20_000);

        await expect(wait).resolves.toEqual({ settled: false, usedEncryptedSearch: false });
    });

    // Clearing `category` keeps the same labelID and takes the `setParams` path, so no loading flag is ever
    // raised: the category is the only thing separating the Inbox from the tab the user was sitting on.
    it('waits for the REQUESTED category, so a read of the Inbox cannot report the tab the user was on', async () => {
        const promotions = { labelID: inbox, hash: 'category=promotions', categoryViewEnabled: true };
        const { store, change } = fakeStore(settledView(promotions));
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        expect(await hasSettled(wait)).toBe(false);

        change(settledView({ labelID: inbox, categoryViewEnabled: true }));
        await expect(wait).resolves.toEqual(settled);
    });

    // The seam the handlers rely on: the URL they push is parsed back into the view they asked for.
    it('reads the requested view out of a URL built by changeSearchParams', async () => {
        const pushed = changeSearchParams(`/${LABEL_IDS_TO_HUMAN[allMail]}`, '', {
            keyword: 'hotel',
            filter: 'unread',
            sort: '-size',
        });
        const { store } = fakeStore(settledView({ labelID: allMail, hash: 'keyword=hotel&filter=unread&sort=-size' }));

        await expect(
            waitForListSettled(store, { labelID: allMail, location: createLocation(pushed) })
        ).resolves.toEqual(settled);
    });

    // Resolving is not the same as succeeding: the caller has to be told, or it reports a still-loading
    // view as an authoritative empty result.
    it('reports a timeout rather than hanging, so a stuck load degrades to "not ready"', async () => {
        const { store, listenerCount } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        expect(await hasSettled(wait)).toBe(false);

        jest.advanceTimersByTime(20_000);

        await expect(wait).resolves.toEqual({ settled: false, usedEncryptedSearch: false });
        expect(listenerCount()).toBe(0);
    });
});
