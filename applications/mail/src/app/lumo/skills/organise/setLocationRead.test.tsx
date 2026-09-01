import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { MailToolDeps } from '../../toolModule';
import { createSetLocationReadHandler, resolveInboxCategory, setLocationReadCardRenderer } from './setLocationRead';

const categoryTab = (id: CategoryLabelID): CategoryTab => ({
    id,
    display: true,
    notify: false,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
});

describe('resolveInboxCategory', () => {
    it('is absent when the model named no category', () => {
        expect(resolveInboxCategory({ location: 'inbox', category: null })).toBeUndefined();
    });

    it('accepts a known category tab in the Inbox', () => {
        expect(resolveInboxCategory({ location: 'inbox', category: 'promotions' })).toBe('promotions');
    });

    it.each([
        ['another standard location', 'archive'],
        ['a custom folder or label target', null],
    ])('rejects a category paired with %s', (_name, location) => {
        expect(() => resolveInboxCategory({ location, category: 'promotions' })).toThrow(/only applies with/);
    });

    it('rejects a category tab that does not exist', () => {
        expect(() => resolveInboxCategory({ location: 'inbox', category: 'receipts' })).toThrow(/Unknown category/);
    });
});

describe('setLocationReadCardRenderer', () => {
    const standardAction: ActionRequest = {
        type: 'set_location_read',
        location: 'inbox',
        target: null,
        category: null,
        read: true,
    };
    const labels = { 'label-m3n4p5': { title: 'Newsletters' } };

    // A proposed action is unvalidated, so the neither-set case is reachable here.
    it.each([
        ['a standard location by its display name', {}, 'Inbox'],
        ['a custom target by its recorded name', { location: null, target: 'label-m3n4p5' }, 'Newsletters'],
        // The user must see what they are approving narrowed, not as the whole Inbox.
        ['the category tab alongside the location', { category: 'promotions' }, 'Inbox · Promotions'],
        ['nothing when neither is set', { location: null }, undefined],
    ])('names %s', (_case, overrides, expected) => {
        const action = { ...standardAction, ...overrides } as ActionRequest;

        expect(setLocationReadCardRenderer.subtitle?.(action, labels)).toBe(expected);
        expect(setLocationReadCardRenderer.detail?.(action, labels)).toBe(expected);
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
    ])('marks a whole standard location %s, never inheriting the on-screen category tab', async (_n, read, status) => {
        const { references, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { location: 'inbox', target: null, category: null, read },
            { references }
        );

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: MAILBOX_LABEL_IDS.INBOX,
            status,
            categoryIDs: [],
        });
    });

    it('scopes the mark to one category tab when the user named one', async () => {
        const { references, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { location: 'inbox', target: null, category: 'promotions', read: true },
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
                { location: 'inbox', target: null, category: 'promotions', read: true },
                { references }
            )
        ).rejects.toThrow(/no "promotions" category tab/);
        expect(markAll).not.toHaveBeenCalled();
    });

    it('resolves a custom label reference to its id', async () => {
        const { references, labelReference, markAll, deps } = setUp();

        await createSetLocationReadHandler(deps)(
            { location: null, target: labelReference, category: null, read: true },
            { references }
        );

        expect(markAll).toHaveBeenCalledWith({
            SourceLabelID: 'LABEL_ID_1',
            status: MARK_AS_STATUS.READ,
            categoryIDs: [],
        });
    });
});
