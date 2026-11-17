import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import sentenceText from '@proton/llm/lib/lumoAgent/ui/sentenceText';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { DefaultFolderReference } from '../../helpers/defaultFolders';
import type { MailToolDeps } from '../../toolModule';
import {
    createSetLocationReadHandler,
    setLocationReadCardRenderer,
    setLocationReadDefinition,
} from './setLocationRead';

const categoryTab = (id: CategoryLabelID): CategoryTab => ({
    id,
    display: true,
    notify: false,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
});

describe('setLocationReadDefinition', () => {
    // Refused before the confirm card, so the user is never asked to approve a scope that cannot run.
    it('refuses a category outside the Inbox in its argument check', () => {
        const check = () =>
            setLocationReadDefinition.checkParams?.({
                target: DefaultFolderReference.ARCHIVE,
                category: 'promotions',
                read: true,
            });

        expect(check).toThrow(ToolInputError);
        expect(check).toThrow(/only applies with/);
    });
});

describe('setLocationReadCardRenderer', () => {
    const standardAction: ActionRequest = {
        type: 'set_location_read',
        target: DefaultFolderReference.INBOX,
        category: null,
        read: true,
    };
    const labels = { [DefaultFolderReference.INBOX]: { title: 'Inbox' }, 'label-m3n4p5': { title: 'Newsletters' } };

    // A proposed action is unvalidated, so the neither-set case is reachable here.
    it.each([
        ['a default folder by its recorded name', {}, 'Inbox'],
        ['a custom target by its recorded name', { target: 'label-m3n4p5' }, 'Newsletters'],
        // The user must see what they are approving narrowed, not as the whole Inbox.
        ['the category tab alongside the location', { category: 'promotions' }, 'Inbox · Promotions'],
        ['nothing when no target is set', { target: null }, undefined],
    ])('names %s', (_case, overrides, expected) => {
        const action = { ...standardAction, ...overrides } as ActionRequest;

        expect(setLocationReadCardRenderer.detail?.(action, labels)).toBe(expected);
    });

    // The sentence and the tile's detail read the same scope, so the card and its receipt name one blast
    // radius rather than two.
    it('names the same scope in the sentence as the settled tile reports', () => {
        const narrowed = { ...standardAction, category: 'promotions' } as ActionRequest;

        expect(sentenceText(setLocationReadCardRenderer.sentence(narrowed, labels))).toContain(
            setLocationReadCardRenderer.detail?.(narrowed, labels) as string
        );
    });

    // A scope the handler would reject must not reach the user as "the whole of  " with a hole in it,
    // and Confirm must not be live over a card that names nothing.
    it('says no scope is set rather than naming an empty one', () => {
        const unscoped = { ...standardAction, target: null } as ActionRequest;

        expect(sentenceText(setLocationReadCardRenderer.sentence(unscoped, labels))).toBe('No location selected');
        expect(setLocationReadCardRenderer.canApply?.({ target: null })).toBe(false);
        expect(setLocationReadCardRenderer.canApply?.({ target: DefaultFolderReference.INBOX })).toBe(true);
    });
});

describe('createSetLocationReadHandler', () => {
    const setUp = (categories: CategoryTab[] = [categoryTab(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)]) => {
        const references = createReferenceRegistry();
        const labelReference = references.referenceFor('label', 'LABEL_ID_1', { title: 'Newsletters' });
        const markAll = jest.fn().mockResolvedValue(undefined);
        const getMailSettings = () => ({ ShowMoved: 0, AlmostAllMail: 0 });
        const deps = { markAll, getMailSettings, getActiveCategoryTabs: () => categories } as unknown as MailToolDeps;

        return { references, labelReference, markAll, deps };
    };

    // `categoryIDs: []` is the whole point of the explicit scope: left unset, the thunk inherits the
    // categories the LIST is showing, so "my whole inbox" covers only the tab the user is sitting on.
    it.each([
        ['read', true, MARK_AS_STATUS.READ],
        ['unread', false, MARK_AS_STATUS.UNREAD],
    ])('marks a whole default folder %s, never inheriting the on-screen category tab', async (_n, read, status) => {
        const { references, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { target: DefaultFolderReference.INBOX, category: null, read },
            { references }
        );

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: MAILBOX_LABEL_IDS.INBOX,
            status,
            categoryIDs: [],
        });
    });

    // The registry here holds no fixed references, so each one must resolve through the default-folder table.
    it.each([
        [DefaultFolderReference.INBOX, MAILBOX_LABEL_IDS.INBOX],
        [DefaultFolderReference.DRAFTS, MAILBOX_LABEL_IDS.DRAFTS],
        [DefaultFolderReference.SENT, MAILBOX_LABEL_IDS.SENT],
        [DefaultFolderReference.STARRED, MAILBOX_LABEL_IDS.STARRED],
        [DefaultFolderReference.ARCHIVE, MAILBOX_LABEL_IDS.ARCHIVE],
        [DefaultFolderReference.SPAM, MAILBOX_LABEL_IDS.SPAM],
        [DefaultFolderReference.TRASH, MAILBOX_LABEL_IDS.TRASH],
        [DefaultFolderReference.ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
        [DefaultFolderReference.SCHEDULED, MAILBOX_LABEL_IDS.SCHEDULED],
        [DefaultFolderReference.SNOOZED, MAILBOX_LABEL_IDS.SNOOZED],
    ])('marks the whole of %s', async (target, labelID) => {
        const { references, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)({ target, category: null, read: true }, { references });

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: labelID,
            status: MARK_AS_STATUS.READ,
            categoryIDs: [],
        });
    });

    it('scopes the mark to one category tab when the user named one', async () => {
        const { references, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { target: DefaultFolderReference.INBOX, category: 'promotions', read: true },
            { references }
        );

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: MAILBOX_LABEL_IDS.INBOX,
            status: MARK_AS_STATUS.READ,
            categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
        });
    });

    it('rejects a category this mailbox does not show, before marking anything', async () => {
        const { references, markAll, deps } = setUp([]);

        await expect(
            createSetLocationReadHandler(deps)(
                { target: DefaultFolderReference.INBOX, category: 'promotions', read: true },
                { references }
            )
        ).rejects.toThrow(/no "promotions" category tab/);
        expect(markAll).not.toHaveBeenCalled();
    });

    it('resolves a custom label reference to its id', async () => {
        const { references, labelReference, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { target: labelReference, category: null, read: true },
            { references }
        );

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: 'LABEL_ID_1',
            status: MARK_AS_STATUS.READ,
            categoryIDs: [],
        });
    });
});
