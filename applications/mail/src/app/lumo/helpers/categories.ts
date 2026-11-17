import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { CATEGORY_LABEL_IDS } from '@proton/shared/lib/constants';
import { HUMAN_TO_LABEL_IDS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { hasLabel } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { DefaultFolderReference } from './defaultFolders';

/** Derived, so the model's vocabulary is exactly the one Mail's own URLs use, in the tabs' display order. */
export const INBOX_CATEGORIES = CATEGORY_LABEL_IDS.map((labelID) => LABEL_IDS_TO_HUMAN[labelID]);

/**
 * Pure: whether the mailbox shows that tab needs the store, so the handler settles that half with
 * {@link resolveCategoryLabelID}. `target` is whichever parameter names the location.
 */
export const resolveInboxCategory = ({
    target,
    category,
}: {
    target: string;
    category: string | null;
}): string | undefined => {
    if (category == null) {
        return undefined;
    }
    if (target !== DefaultFolderReference.INBOX) {
        throw new ToolInputError(
            '`category` is a tab inside the Inbox, so it only applies with "folder-inbox" as the location: leave `category` null for anywhere else.'
        );
    }
    if (!INBOX_CATEGORIES.includes(category)) {
        throw new ToolInputError(
            `Unknown category "${category}". Valid categories are: ${INBOX_CATEGORIES.join(
                ', '
            )}. Leave \`category\` null to cover the whole Inbox.`
        );
    }
    return category;
};

/** The model's category names ARE Mail's URL vocabulary, so they resolve through the same map the URL does. */
const categoryLabelID = (category: string): CategoryLabelID | undefined => {
    const labelID = HUMAN_TO_LABEL_IDS[category];
    return isCategoryLabel(labelID) ? labelID : undefined;
};

/** Rejects a category this mailbox does not show: with the category view off there are no tabs, and a tab
 *  the user switched off folds back into Primary — either way that scope holds no mail of its own. */
export const resolveCategoryLabelID = (category: string, tabs: CategoryTab[]): CategoryLabelID => {
    const labelID = categoryLabelID(category);

    if (!labelID || !tabs.some((tab) => tab.id === labelID)) {
        throw new ToolInputError(
            `This mailbox has no "${category}" category tab, so there is no such scope in it. Leave \`category\` null to cover the whole Inbox.`
        );
    }

    return labelID;
};

/**
 * Both halves of the check for a navigation read: the tab is valid for the location, and the mailbox shows
 * it. Returns the tab in Mail's URL vocabulary, ready for the `category` hash key, or undefined for none.
 */
export const resolveInboxTab = (
    scope: { target: string; category: string | null },
    tabs: CategoryTab[]
): string | undefined => {
    const category = resolveInboxCategory(scope);
    if (!category) {
        return undefined;
    }

    return LABEL_IDS_TO_HUMAN[resolveCategoryLabelID(category, tabs)];
};

/** Mail's own open and search do this: the Inbox with tabs on but no tab named lands on Primary. */
export const PRIMARY_ONLY_NOTE =
    'With category tabs on, the Inbox with no category covers the Primary tab only; set category to reach another tab.';

export const coversPrimaryOnly = (
    { target, category }: { target: string | null; category: string | null },
    categoryTabsShown: boolean
): boolean => {
    return categoryTabsShown && target === DefaultFolderReference.INBOX && !category;
};

/** Takes a raw string because a confirm card renders a *proposed* category, before any handler has validated it. */
const categoryDisplayName = (category: string): string => {
    const labelID = categoryLabelID(category);
    return (labelID && getLabelFromCategoryId(labelID)) || category;
};

/** The tab label an email carries, or undefined for one the server has not categorised. */
export const elementCategoryID = (element: Element): CategoryLabelID | undefined => {
    return CATEGORY_LABEL_IDS.find((labelID) => hasLabel(element, labelID));
};

/**
 * One way to name a location narrowed to a tab, e.g. "Inbox · Promotions", shared by cards, chips and results.
 * With no tab it is the location's own name.
 */
export const categoryScopeName = (location: string, category?: string | null): string => {
    if (!category) {
        return location;
    }

    return `${location} · ${categoryDisplayName(category)}`;
};
