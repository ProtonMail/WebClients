import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { HUMAN_TO_LABEL_IDS } from '@proton/shared/lib/mail/constants';

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

/** Takes a raw string, like {@link locationDisplayName}: a confirm card renders a *proposed* category. */
export const categoryDisplayName = (category: string): string => {
    const labelID = categoryLabelID(category);
    return (labelID && getLabelFromCategoryId(labelID)) || category;
};
