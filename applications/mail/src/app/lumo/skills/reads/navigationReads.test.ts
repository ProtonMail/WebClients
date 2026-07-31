/**
 * A navigation read goes push-then-settle-then-project (`navigateAndReadRows`), so it is exercised against
 * a fake-store harness. The pure parts are covered in `openFolder.test.ts`; what these pin is the
 * composition — the URL actually pushed, and that the rows come from the view that URL settles on rather
 * than the one that was on screen before.
 */
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { HUMAN_TO_LABEL_IDS } from '@proton/shared/lib/mail/constants';
import { ALMOST_ALL_MAIL, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { getParamsFromPathname } from 'proton-mail/helpers/mailboxUrl';
import type { Element } from 'proton-mail/models/element';

import { fakeStore, settledView } from '../../helpers/navigation.test.helpers';
import type { MailToolDeps } from '../../toolModule';
import { createOpenFolderHandler } from './openFolder';

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
}: {
    landing?: Element[];
    folders?: Folder[];
    labels?: Label[];
    showMoved?: number;
    almostAllMail?: ALMOST_ALL_MAIL;
} = {}) => {
    const { store, change } = fakeStore();
    const pushed: string[] = [];

    // The URL segment is the HUMAN label ("all-mail"), which the app maps back to the id before it reaches
    // the params — see `getLabelIDFromRawID` in useElements. A custom folder id passes straight through.
    // The landing rows are stamped into the view's label, since the list drops anything not filed there.
    const push = (url: string) => {
        pushed.push(url);
        const [pathname, hash = ''] = url.split('#');
        const rawID = getParamsFromPathname(pathname).params.labelID;
        const labelID = HUMAN_TO_LABEL_IDS[rawID] || rawID;
        const filed = landing.map((element) => ({ ...element, Labels: [{ ID: labelID, ContextNumMessages: 1 }] }));
        change(settledView(labelID, hash, filed as Element[]));
    };

    const deps = {
        store,
        history: { location: { pathname: '/inbox', hash: '', search: '' }, push },
        getFolders: () => folders,
        getLabels: () => labels,
        getMailSettings: () => ({ ShowMoved: showMoved, AlmostAllMail: almostAllMail, PageSize: 50 }),
    } as unknown as MailToolDeps;

    return {
        deps,
        references: createReferenceRegistry(),
        pathOf: () => pushed[0].split('#')[0],
        hashOf: () => pushed[0].split('#')[1] ?? '',
    };
};

const hashParams = (hash: string) => Object.fromEntries(new URLSearchParams(hash));

describe('open_folder handler', () => {
    const openParams = (overrides = {}) => ({ location: null, target: null, filter: null, sort: null, ...overrides });

    it('opens a standard location and returns what is now on screen', async () => {
        const { deps, references, hashOf } = harness({ landing: [email('ELEMENT_1', 'Junk offer')] });

        const result = await createOpenFolderHandler(deps)(openParams({ location: 'spam' }), { references });

        expect(result.location).toBe('Spam');
        expect(result.rows.map((row) => row.subject)).toEqual(['Junk offer']);
        expect(hashOf()).toBe('');
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
