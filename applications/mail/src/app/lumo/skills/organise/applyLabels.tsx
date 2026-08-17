import { c, msgid } from 'ttag';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcTag } from '@proton/icons/icons/IcTag';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type {
    ActionRequest,
    ReferenceRegistry,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';

import { resolveElements, resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { emailIds, hasEmailSelection, referenceName, renderEmailSelectionBody } from './emailSelection';

export interface ApplyLabelsParams {
    ids: string[];
    /** Additive: every label named here is added, none removed. */
    labels: string[];
}

/**
 * Build `applyMultipleLocations`' `changes` map, rejecting two inputs the hook itself only reports as
 * bare `'Changes are required'` or not at all: an empty list, and a reference of the wrong kind — the
 * registry is one flat map, so a stray `email-…` would otherwise resolve to a message id and be applied
 * as a label. Pure, so both are caught before the store is touched.
 */
export const resolveLabelChanges = (labelReferences: string[], references: ReferenceRegistry): Record<string, true> => {
    if (!labelReferences.length) {
        throw new ToolInputError(
            'apply_labels needs at least one label-… reference in `labels`. Use one returned by list_labels, or create the label first with create_label.'
        );
    }
    return Object.fromEntries(
        labelReferences.map((reference) => [resolveTypedId(reference, ['label'], references), true] as const)
    );
};

export const applyLabelsDefinition: ToolDefinition<ApplyLabelsParams, void> = {
    name: 'apply_labels',
    kind: 'mutation',
    toolDescription:
        'Add one or more labels to one or more emails. Labels are additive tags and do NOT move the email (unlike move_emails). `ids` are email-… references from view_emails/search; `labels` are label-… references from list_labels. Use for "tag/label these as X". The on-screen rows show which labels an email already carries: a row lists them as `labels: …`, and a row without that part carries none. Only pass emails that are missing the label you are adding — if every email the user means already carries it, tell them there is nothing to do instead of proposing this. This tags only the specific emails you pass — it does NOT act on future mail; for a rule that automatically tags or files incoming mail, use create_filter. If the label does not exist yet, create it first with create_label. Proposed to the user for confirmation before it runs. Example: { "ids": ["email-a1b2c3"], "labels": ["label-m3n4p5"] }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'labels'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            labels: { type: 'array', items: { type: 'string' } },
        },
    },
    examples: [
        {
            context:
                'search returned email-a1b2c3, and list_labels returned `label-m3n4p5 | "Receipts"`. Tag that email with the Receipts label.',
            call: { ids: ['email-a1b2c3'], labels: ['label-m3n4p5'] },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Apply labels` }),
};

export const createApplyLabelsHandler =
    (mail: MailToolDeps): ToolHandler<ApplyLabelsParams, void> =>
    async ({ ids, labels }, { references }) => {
        const elements = resolveElements(mail.store, ids, references);
        const changes = resolveLabelChanges(labels, references);
        // `createFilters: false` — tagging these emails must not also propose a rule for future mail; that
        // is `create_filter`'s job, and the tool description draws the same line for the model.
        await mail.applyMultipleLocations({ elements, createFilters: false, changes });
    };

const labelNames = (action: ActionRequest, labels: Record<string, string>): string =>
    ((action.labels as string[]) ?? []).map((reference) => referenceName(reference, labels)).join(', ');

/** No `→` anywhere, unlike move_emails: an arrow reads as "moved into Receipts", the exact confusion the
 *  tool description exists to prevent. */
export const applyLabelsCardRenderer: CardRenderer = {
    icon: IcTag,
    title: () => c('Title').t`Apply labels`,
    subtitle: (action, labels) => labelNames(action, labels) || undefined,
    renderBody: renderEmailSelectionBody,
    canApply: hasEmailSelection,
    detail: (action, labels) => {
        const count = emailIds(action).length;
        const names = labelNames(action, labels);
        return c('Info').ngettext(msgid`${count} email · ${names}`, `${count} emails · ${names}`, count);
    },
};

export const applyLabelsModule: MailToolModule = {
    definition: applyLabelsDefinition,
    createHandler: createApplyLabelsHandler,
    cardRenderer: applyLabelsCardRenderer,
};
