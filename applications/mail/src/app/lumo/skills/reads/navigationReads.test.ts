/**
 * The two navigation reads share the push-then-settle-then-project path (`navigateAndReadRows`), so they
 * share one fake-store harness. Their pure parts are covered in `search.test.ts` / `openFolder.test.ts`;
 * what these pin is the composition — the URL actually pushed, and that the rows come from the view that
 * URL settles on rather than the one that was on screen before.
 */
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { HUMAN_TO_LABEL_IDS } from '@proton/shared/lib/mail/constants';
import { ALMOST_ALL_MAIL, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { getParamsFromPathname } from 'proton-mail/helpers/mailboxUrl';
import type { Element } from 'proton-mail/models/element';

import { fakeStore, indexedESStatus, settledView } from '../../helpers/navigation.test.helpers';
import type { MailToolDeps } from '../../toolModule';
import { createOpenFolderHandler } from './openFolder';
import { createSearchHandler } from './search';

/** A conversation, since `conversationMode` is the mailbox default — so its labels live in `Labels`. */
const email = (id: string, subject: string): Element =>
    ({
        ID: id,
        Subject: subject,
        Senders: [{ Name: 'Alice', Address: 'alice@example.com' }],
        Time: Math.floor(new Date(2026, 6, 29, 9, 0).getTime() / 1000),
        Labels: [],
        NumMessages: 1,
        NumAttachments: 0,
        NumUnread: 0,
    }) as unknown as Element;

/**
 * The store settles on whatever the handler pushed, so the read has a view to project. Deriving the settled
 * params from the pushed URL is the point: a handler that pushes the wrong URL never settles, and the
 * assertion fails on empty rows rather than passing on a stale view.
 */
const harness = ({
    landing = [],
    folders = [],
    labels = [],
    showMoved = 0,
    almostAllMail = ALMOST_ALL_MAIL.DISABLED,
    esStatus = {},
    usedEncryptedSearch = true,
    settles = true,
    blockedLabelIDs = [],
}: {
    landing?: Element[];
    folders?: Folder[];
    labels?: Label[];
    showMoved?: number;
    almostAllMail?: ALMOST_ALL_MAIL;
    /** Overrides on a fully indexed device — the coverage rule itself is pinned in `contentSearch.test.ts`. */
    esStatus?: Partial<ESStatusBooleans>;
    /** Whether Encrypted Search, rather than the server, produced the page the navigation lands on. */
    usedEncryptedSearch?: boolean;
    /** False leaves the list loading forever, so the read runs out its settle timeout. */
    settles?: boolean;
    /** Labels a bulk action is working through: the list is cleared and blocked from reloading there. */
    blockedLabelIDs?: string[];
} = {}) => {
    const { store, change } = fakeStore();
    const pushed: string[] = [];

    // The URL segment is the HUMAN label ("all-mail"), which the app maps back to the id before it reaches
    // the params — see `getLabelIDFromRawID` in useElements. A custom folder id passes straight through.
    // The landing rows are stamped into the view's label, since the list drops anything not filed there.
    const push = (url: string) => {
        pushed.push(url);
        if (!settles) {
            return;
        }
        const [pathname, hash = ''] = url.split('#');
        const rawID = getParamsFromPathname(pathname).params.labelID;
        const labelID = HUMAN_TO_LABEL_IDS[rawID] || rawID;
        const filed = landing.map((element) => ({ ...element, Labels: [{ ID: labelID, ContextNumMessages: 1 }] }));
        change({
            ...settledView({ labelID, hash, elements: filed as Element[] }),
            usedEncryptedSearch,
            taskRunning: { labelIDs: blockedLabelIDs, timeoutID: undefined },
        });
    };

    const deps = {
        store,
        history: { location: { pathname: '/inbox', hash: '', search: '' }, push },
        getFolders: () => folders,
        getLabels: () => labels,
        getMailSettings: () => ({ ShowMoved: showMoved, AlmostAllMail: almostAllMail, PageSize: 50 }),
        getESStatus: () => indexedESStatus(esStatus),
    } as unknown as MailToolDeps;

    return {
        deps,
        references: createReferenceRegistry(),
        pathOf: () => pushed[0].split('#')[0],
        hashOf: () => pushed[0].split('#')[1] ?? '',
    };
};

const hashParams = (hash: string) => Object.fromEntries(new URLSearchParams(hash));

const searchParams = (overrides = {}) => ({
    keyword: null,
    from: null,
    to: null,
    target: null,
    begin: null,
    end: null,
    filter: null,
    ...overrides,
});

describe('search handler', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('searches all mail and returns the rows that landed, with no follow-up view_emails needed', async () => {
        const { deps, references, hashOf } = harness({ landing: [email('ELEMENT_1', 'Hotel booking')] });

        const result = await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(hashParams(hashOf())).toEqual({ keyword: 'hotel' });
        expect(result.rows.map((row) => row.subject)).toEqual(['Hotel booking']);
        expect(result.total).toBe(1);
        expect(result.coverage).toBe('full');
    });

    it('bounds a date range on local calendar days, with the end inclusive', async () => {
        const { deps, references, hashOf } = harness();

        await createSearchHandler(deps)(searchParams({ begin: '2026-07-01', end: '2026-07-29' }), { references });

        const { begin, end } = hashParams(hashOf());
        expect(Number(begin)).toBe(Math.floor(new Date(2026, 6, 1).getTime() / 1000));
        // The whole of the 29th, so a range ending on 29 July includes that day's mail.
        expect(Number(end) - Number(begin)).toBe(29 * 86_400);
    });

    // A search view is sorted client-side over the matches already loaded, so a size sort would name the
    // biggest of a partial batch. Mail's own advanced search drops sort for the same reason.
    it('carries the filter through as a mailbox hash value, and never a sort', async () => {
        const { deps, references, hashOf } = harness();

        await createSearchHandler(deps)(searchParams({ keyword: 'hotel', filter: 'has_attachment' }), {
            references,
        });

        expect(hashParams(hashOf())).toEqual({ keyword: 'hotel', filter: 'has-file' });
    });

    // Category view puts the user on a tab, and the hash key survives a navigation that does not clear it —
    // so "search my mail" would quietly cover only Social.
    it('clears the category tab left in the URL, so a search covers the whole location', async () => {
        const { deps, references, hashOf } = harness();
        deps.history.location.hash = '#category=social';

        await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(hashParams(hashOf())).toEqual({ keyword: 'hotel' });
    });

    it.each(['folder', 'label'] as const)('scopes to a %s by reference and reports its NAME', async (type) => {
        const { deps, references } = harness();
        const reference = references.referenceFor(type, 'TARGET_1', 'Travel');

        const result = await createSearchHandler(deps)(searchParams({ keyword: 'hotel', target: reference }), {
            references,
        });

        expect(result.targetName).toBe('Travel');
        expect(result.query).toBe('"hotel", in Travel');
        expect(result.query).not.toContain(reference);
    });

    it('rejects a non-folder reference rather than navigating to a message id', async () => {
        const { deps, references } = harness();
        const reference = references.referenceFor('email', 'ELEMENT_1', 'Hotel booking');

        await expect(createSearchHandler(deps)(searchParams({ target: reference }), { references })).rejects.toThrow(
            /not a folder or label reference/
        );
    });

    it('rejects a hallucinated folder reference', async () => {
        const { deps, references } = harness();

        await expect(
            createSearchHandler(deps)(searchParams({ target: 'folder-zzzzzz' }), { references })
        ).rejects.toThrow(/Unknown reference/);
    });

    it('searches All mail when Spam and Trash are not excluded', async () => {
        const { deps, references, pathOf } = harness();

        await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(pathOf()).toBe('/all-mail');
    });

    // Otherwise Lumo answers from mail the user deleted or that landed in Spam, which their own search
    // over the same words would never have shown them.
    it('excludes Spam and Trash from an unscoped search when the user set that', async () => {
        const { deps, references, pathOf } = harness({ almostAllMail: ALMOST_ALL_MAIL.ENABLED });

        await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(pathOf()).toBe('/almost-all-mail');
    });

    it('reports body search as unavailable when Encrypted Search is not ready on this device', async () => {
        const { deps, references } = harness({ esStatus: { contentIndexingDone: false } });

        const result = await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(result.coverage).toBe('metadata_only');
    });

    // The index being capped is invisible in the rows, so the result payload is the only place the model
    // can learn that an empty search does not mean the email is absent.
    it('reports coverage as partial when the index on this device is capped', async () => {
        const { deps, references } = harness({ esStatus: { isDBLimited: true } });

        const result = await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(result.coverage).toBe('partial');
    });

    // The device is fully indexed, so the ES status alone would vouch for the whole mailbox — but this
    // search was served by the server, which reads metadata only.
    it('reports metadata only when the search fell back to the server on an indexed device', async () => {
        const { deps, references } = harness({ usedEncryptedSearch: false });

        const result = await createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });

        expect(result.coverage).toBe('metadata_only');
    });

    // The timeout projects a view that has not loaded, so without this the model is handed zero rows and a
    // note vouching for the whole mailbox — and tells the user the email does not exist.
    it('reports an unfinished search rather than an empty mailbox when the list never settles', async () => {
        jest.useFakeTimers();
        const { deps, references } = harness({ settles: false });

        const pending = createSearchHandler(deps)(searchParams({ keyword: 'hotel' }), { references });
        await jest.advanceTimersByTimeAsync(20_000);
        const result = await pending;

        expect(result.rows).toEqual([]);
        expect(result.coverage).toBe('unfinished');
    });
});

describe('open_folder handler', () => {
    const openParams = (overrides = {}) => ({ location: null, target: null, filter: null, sort: null, ...overrides });

    it('opens a standard location and returns what is now on screen', async () => {
        const { deps, references, hashOf } = harness({ landing: [email('ELEMENT_1', 'Junk offer')] });

        const result = await createOpenFolderHandler(deps)(openParams({ location: 'spam' }), { references });

        expect(result.location).toBe('Spam');
        expect(result.rows.map((row) => row.subject)).toEqual(['Junk offer']);
        expect(hashOf()).toBe('');
    });

    // A mark-all clears its location's list and blocks it from reloading, so an open lands on nothing. Left
    // unsaid, the model reports the location as empty; and without the wait's short-circuit it would first
    // sit out the full settle timeout waiting for a page that cannot arrive.
    it('reports a location a bulk action is still emptying, rather than calling it empty', async () => {
        jest.useFakeTimers();
        const { deps, references } = harness({ blockedLabelIDs: [MAILBOX_LABEL_IDS.INBOX] });

        const result = await createOpenFolderHandler(deps)(openParams({ location: 'inbox' }), { references });

        expect(result.rows).toEqual([]);
        expect(result.bulkActionRunning).toBe(true);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('opens a custom folder by reference, under its own name', async () => {
        const { deps, references } = harness();
        const reference = references.referenceFor('folder', 'FOLDER_1', 'Travel');

        const result = await createOpenFolderHandler(deps)(openParams({ target: reference }), { references });

        expect(result.location).toBe('Travel');
    });

    it('rejects a non-folder reference as a target', async () => {
        const { deps, references } = harness();
        const reference = references.referenceFor('email', 'ELEMENT_1', 'Hotel booking');

        await expect(createOpenFolderHandler(deps)(openParams({ target: reference }), { references })).rejects.toThrow(
            /not a folder or label reference/
        );
    });

    // Drafts and All mail are each a PAIR of labels, and a mail setting picks which one the user has. Open
    // the wrong one and they land in a view their own sidebar does not link to.
    it('opens plain Drafts, or All drafts when Show-moved says so', async () => {
        const { deps, references, pathOf } = harness();
        await createOpenFolderHandler(deps)(openParams({ location: 'drafts' }), { references });
        expect(pathOf()).toBe('/drafts');

        const moved = harness({ showMoved: SHOW_MOVED.DRAFTS });
        await createOpenFolderHandler(moved.deps)(openParams({ location: 'drafts' }), {
            references: moved.references,
        });
        expect(moved.pathOf()).toBe('/all-drafts');
    });

    it('opens All mail, or Almost-all-mail when Spam and Trash are excluded', async () => {
        const { deps, references, pathOf } = harness();
        const result = await createOpenFolderHandler(deps)(openParams({ location: 'all_mail' }), { references });
        expect(pathOf()).toBe('/all-mail');

        const excluded = harness({ almostAllMail: ALMOST_ALL_MAIL.ENABLED });
        const excludedResult = await createOpenFolderHandler(excluded.deps)(openParams({ location: 'all_mail' }), {
            references: excluded.references,
        });
        expect(excluded.pathOf()).toBe('/almost-all-mail');
        // Both are "All mail" to the user, so the chip must not give the distinction away.
        expect(excludedResult.location).toBe(result.location);
    });

    it('narrows the opened view by filter and sort', async () => {
        const { deps, references, hashOf } = harness();

        await createOpenFolderHandler(deps)(openParams({ location: 'archive', filter: 'unread', sort: 'oldest' }), {
            references,
        });

        expect(hashParams(hashOf())).toEqual({ filter: 'unread', sort: 'date' });
    });

    // A plain open must not inherit the previous search's query, or it silently reads a filtered view.
    it('clears a search left in the URL by an earlier navigation', async () => {
        const { deps, references, hashOf } = harness();
        deps.history.location.hash = '#keyword=hotel&from=alice@example.com&page=2&wildcard=1';

        await createOpenFolderHandler(deps)(openParams({ location: 'inbox' }), { references });

        expect(hashOf()).toBe('');
    });
});
