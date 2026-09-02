import { c } from 'ttag';

import { getMailBugCategoryValues } from '@proton/components/containers/support/bugCategories';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { BugModalPrefill } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

import type { MailToolModule } from '../../toolModule';

export interface OpenSupportTicketParams {
    /** A clear, self-contained description of the problem, written from the conversation. */
    description: string;
    /** A best-effort problem category; null leaves the form on its default. */
    category: string | null;
}

/**
 * Read from the form's own option list, so a category added, renamed or removed there reaches the model
 * without this file being edited. It lives in the schema rather than in `toolDescription` because a list
 * in the prose reads to the model as a menu to offer the user — it recited all 22 back to them and asked
 * which one fitted. Safe at module scope: only the untranslated `value`s are read, so the list does not
 * depend on the locale being loaded.
 */
const CATEGORY_VALUES = getMailBugCategoryValues();

/** `BugModal` seeds its form from `undefined`, not `null`, when a field is left to its default. */
export const toBugModalPrefill = ({ description, category }: OpenSupportTicketParams): BugModalPrefill => {
    return { description, category: category ?? undefined };
};

export const openSupportTicketDefinition: ToolDefinition<OpenSupportTicketParams, void> = {
    name: 'open_support_ticket',
    kind: 'read',
    toolDescription: `Open the "Report a problem" form on the user's screen, pre-filled from what they described, for them to review and send. This is the LAST step, not the first answer to a complaint: when the user reports something broken or confusing, first try to solve it with your ${BRAND_NAME} knowledge tool and answer them. Use this tool only when that lookup has no answer, or when the user explicitly asks to contact support, speak to a human, or file a bug report. \`description\` is required — a clear, self-contained summary of the problem written from the conversation in the user's own terms; a form that opens empty is worse than not opening it, so if what they have told you is too thin to write one, ask a short question or two about what went wrong, then open the form. Choose \`category\` YOURSELF from this tool's \`category\` enum — the closest match, or null when none fits. NEVER ask the user which category to use and never list the categories to them: the form shows a category dropdown they can change themselves, and an unrecognised value falls back to its default. Opening the form is all this tool does: the user reviews the form and submits it themselves, Lumo never submits it and cannot see what is sent. The report is not end-to-end encrypted, so keep the description free of sensitive content.`,
    // Both params carry the user's own words, so neither may be checked against the reference registry.
    freeTextParams: ['description', 'category'],
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['description', 'category'],
        properties: {
            description: { type: 'string', minLength: 1 },
            category: { type: ['string', 'null'], enum: [...CATEGORY_VALUES, null] },
        },
    },
    examples: [
        {
            context: 'The user says the unread count in the sidebar is wrong after they archive something.',
            call: {
                description: 'The unread count in the sidebar stays too high after archiving an email.',
                category: 'Mail problem',
            },
        },
        {
            context: 'The user asks to report a problem but has not said which part of Proton it affects.',
            call: { description: 'Something is broken and the app is not behaving as expected.', category: null },
        },
    ],
    serializeForLumo: () => {
        return 'The "Report a problem" form is open on the user\'s screen, pre-filled with the description. The user reviews and submits it themselves; its contents are never visible to Lumo. Reports are not end-to-end encrypted.';
    },
    summarizeChip: () => {
        return { label: c('Info').t`Opened a problem report` };
    },
};

/**
 * Opens the app-shell "Report a problem" modal pre-filled from the conversation, over the same-window
 * postMessage seam `DrawerBugModal` listens on. A UI-open, so it is classified as a read (auto-run) and
 * carries no confirm card: the modal itself is the review step and the user submits it — Lumo never does.
 */
export const createOpenSupportTicketHandler = (): ToolHandler<OpenSupportTicketParams, void> => async (params) => {
    window.postMessage(
        { type: DRAWER_EVENTS.OPEN_BUG_MODAL, payload: toBugModalPrefill(params) },
        window.location.origin
    );
};

export const openSupportTicketModule: MailToolModule = {
    definition: openSupportTicketDefinition,
    createHandler: createOpenSupportTicketHandler,
};
