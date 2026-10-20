import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';
import { ConfirmStatus } from '@proton/llm/lib/lumoAgent/ui/types';

import { CatActivity } from './catPose';

// Tool names rather than the skill definitions, which would pull the skills into the mailbox chunk
const READ_ACTIVITIES = new Map<string, CatActivity>([
    ['open_folder', CatActivity.BROWSE_FOLDERS],
    ['list_folders', CatActivity.BROWSE_FOLDERS],
    ['list_labels', CatActivity.BROWSE_FOLDERS],
    ['search', CatActivity.SEARCH],
    ['find_contacts', CatActivity.SEARCH],
]);
const DRAFT_TOOLS = new Set(['create_draft', 'revise_draft']);

/** A read's chip lands once the read is done, so its activity lasts until Lumo's next step or reply. */
export const selectCatActivity = (items: LumoAgentItem[], isBusy: boolean): CatActivity | null => {
    const lastItem = items.at(-1);
    if (!isBusy || !lastItem) {
        return null;
    }
    if (lastItem.kind === 'chip') {
        return READ_ACTIVITIES.get(lastItem.tool) ?? null;
    }
    if (
        lastItem.kind === 'confirm' &&
        lastItem.status === ConfirmStatus.PENDING &&
        DRAFT_TOOLS.has(lastItem.action.type)
    ) {
        return CatActivity.WRITE;
    }
    return null;
};
