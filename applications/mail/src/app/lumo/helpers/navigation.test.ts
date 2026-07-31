import { createLocation } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { waitForListSettled } from './navigation';
import { fakeStore, locationFor, settledView } from './navigation.test.helpers';

/** Without sitting out the settle timeout. */
const isSettled = (promise: Promise<void>) =>
    Promise.race([promise.then(() => true), Promise.resolve().then(() => false)]);

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
        const { store } = fakeStore(settledView(inbox));

        await expect(
            waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) })
        ).resolves.toBeUndefined();
    });

    it('resolves once the expected location settles, and unsubscribes', async () => {
        const { store, change, listenerCount } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        expect(await isSettled(wait)).toBe(false);

        change(settledView(inbox));

        await expect(wait).resolves.toBeUndefined();
        expect(listenerCount()).toBe(0);
    });

    it('ignores a settle on a DIFFERENT location than the one navigated to', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        change(settledView(MAILBOX_LABEL_IDS.ARCHIVE));

        expect(await isSettled(wait)).toBe(false);
    });

    it('requires search to be CLEARED for a plain open', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail) });

        change(settledView(allMail, 'keyword=hotel'));
        expect(await isSettled(wait)).toBe(false);

        change(settledView(allMail));
        await expect(wait).resolves.toBeUndefined();
    });

    it('waits for the REQUESTED query, not merely any search', async () => {
        const { store, change } = fakeStore();
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'keyword=hotel') });

        change(settledView(allMail, 'keyword=invoice'));
        expect(await isSettled(wait)).toBe(false);

        change(settledView(allMail, 'keyword=hotel'));
        await expect(wait).resolves.toBeUndefined();
    });

    // The stale-rows case: same label, same (empty) query, so only the filter tells the two views apart.
    it('waits for the REQUESTED filter, so a filter-only navigation cannot read the unfiltered page', async () => {
        const { store, change } = fakeStore(settledView(allMail));
        const wait = waitForListSettled(store, { labelID: allMail, location: locationFor(allMail, 'filter=unread') });

        expect(await isSettled(wait)).toBe(false);

        change(settledView(allMail, 'filter=unread'));
        await expect(wait).resolves.toBeUndefined();
    });

    it('waits for the REQUESTED sort and date bounds', async () => {
        const { store, change } = fakeStore(settledView(allMail, 'keyword=hotel'));
        const wait = waitForListSettled(store, {
            labelID: allMail,
            location: locationFor(allMail, 'keyword=hotel&sort=-size&begin=1784073600'),
        });

        expect(await isSettled(wait)).toBe(false);

        change(settledView(allMail, 'keyword=hotel&sort=-size'));
        expect(await isSettled(wait)).toBe(false);

        change(settledView(allMail, 'keyword=hotel&sort=-size&begin=1784073600'));
        await expect(wait).resolves.toBeUndefined();
    });

    // The seam the handlers rely on: the URL they push is parsed back into the view they asked for.
    it('reads the requested view out of a URL built by changeSearchParams', async () => {
        const pushed = changeSearchParams(`/${LABEL_IDS_TO_HUMAN[allMail]}`, '', {
            keyword: 'hotel',
            filter: 'unread',
            sort: '-size',
        });
        const { store } = fakeStore(settledView(allMail, 'keyword=hotel&filter=unread&sort=-size'));

        await expect(
            waitForListSettled(store, { labelID: allMail, location: createLocation(pushed) })
        ).resolves.toBeUndefined();
    });

    it('resolves on timeout, so a stuck load degrades to "not ready" rather than hanging', async () => {
        const { store, listenerCount } = fakeStore();
        const wait = waitForListSettled(store, { labelID: inbox, location: locationFor(inbox) });

        expect(await isSettled(wait)).toBe(false);

        jest.advanceTimersByTime(20_000);

        await expect(wait).resolves.toBeUndefined();
        expect(listenerCount()).toBe(0);
    });
});
