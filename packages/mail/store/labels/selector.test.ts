import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Category, Label } from '@proton/shared/lib/interfaces';

import type { CategoriesState } from './index';
import { selectHasDefaultB2CCategoryConfiguration } from './selector';

// The categories slice (./index) imports the @proton/account barrel, which pulls in the SSO/crypto
// ESM chain this package's jest config does not transform. The selector needs none of it at runtime,
// so we stub the two symbols the slice actually uses at load time.
jest.mock('@proton/account', () => ({
    getInitialModelState: (value: unknown) => ({
        value,
        error: undefined,
        meta: { fetchedAt: 0, fetchedEphemeral: true },
    }),
    serverEvent: Object.assign(() => ({ type: 'serverEvent' }), { type: 'serverEvent' }),
}));

// Build a complete Label so the test protects against future field changes, not just today's shape.
const buildCategoryLabel = (overrides: Partial<Label> & Pick<Label, 'ID'>): Label => ({
    Name: 'category',
    Color: '#8080FF',
    ContextTime: 0,
    Type: 1,
    Order: 0,
    Path: '',
    Display: 1,
    Notify: 0,
    LastUnseenMessageEventID: null,
    ...overrides,
});

// The pristine configuration: Primary/Social/Promotions/Newsletters shown, Updates/Transactions hidden,
// and only Primary notifying.
const buildDefaultCategories = (): Label[] => [
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Display: 1, Notify: 1 }),
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Display: 1, Notify: 0 }),
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Display: 1, Notify: 0 }),
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Display: 1, Notify: 0 }),
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES, Display: 0, Notify: 0 }),
    buildCategoryLabel({ ID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, Display: 0, Notify: 0 }),
];

const buildState = (categories: Label[]): CategoriesState => ({
    categories: { value: categories as Category[], error: undefined, meta: { fetchedAt: 0, fetchedEphemeral: true } },
});

describe('selectHasDefaultB2CCategoryConfiguration', () => {
    it('returns true for the pristine default configuration', () => {
        const state = buildState(buildDefaultCategories());
        expect(selectHasDefaultB2CCategoryConfiguration(state)).toBe(true);
    });

    it('returns false when a shown category has been hidden', () => {
        const categories = buildDefaultCategories().map((category) =>
            category.ID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL ? { ...category, Display: 0 } : category
        );

        const state = buildState(categories);
        expect(selectHasDefaultB2CCategoryConfiguration(state)).toBe(false);
    });

    it('returns false when notifications were enabled on Promotions', () => {
        const categories = buildDefaultCategories().map((category) =>
            category.ID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS ? { ...category, Notify: 1 } : category
        );

        const state = buildState(categories);
        expect(selectHasDefaultB2CCategoryConfiguration(state)).toBe(false);
    });

    // The regression the old activeCategoriesTabs helper could not catch: notify changed on a hidden category.
    it('returns false when notifications were enabled on a hidden category', () => {
        const categories = buildDefaultCategories().map((category) =>
            category.ID === MAILBOX_LABEL_IDS.CATEGORY_UPDATES ? { ...category, Notify: 1 } : category
        );

        const state = buildState(categories);
        expect(selectHasDefaultB2CCategoryConfiguration(state)).toBe(false);
    });

    it('ignores non-category labels', () => {
        const categories = [...buildDefaultCategories(), buildCategoryLabel({ ID: 'custom-label-id' })];

        const state = buildState(categories);
        expect(selectHasDefaultB2CCategoryConfiguration(state)).toBe(true);
    });
});
