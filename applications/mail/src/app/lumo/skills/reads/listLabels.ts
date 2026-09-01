import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { serializeCatalogue } from './catalogue';

export interface LabelSummary {
    reference: string;
    name: string;
    color: string;
}

export interface ListLabelsResult {
    labels: LabelSummary[];
}

export const listLabelsDefinition: ToolDefinition<Record<string, never>, ListLabelsResult> = {
    name: 'list_labels',
    kind: 'read',
    toolDescription:
        "List the user's labels — each with its label-… reference, name, and colour. Use to resolve a label the user names into a label-… reference before applying it, or to check whether a label already exists. Labels are additive tags (an email can carry several); folders are exclusive. Read-only.",
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) =>
        serializeCatalogue(
            `${result.labels.length} labels:`,
            result.labels.map((label) => `${label.reference} | "${label.name}" | ${label.color}`),
            'The user has no labels.'
        ),
    summarizeChip: (_params, result) => {
        const count = result.labels.length;
        return { label: c('Info').ngettext(msgid`Read your ${count} label`, `Read your ${count} labels`, count) };
    },
};

export const createListLabelsHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ListLabelsResult> =>
    async (_params, { references }) => ({
        labels: mail.getLabels().map((label) => ({
            reference: references.referenceFor('label', label.ID, { title: label.Name }),
            name: label.Name,
            color: label.Color,
        })),
    });

export const listLabelsModule: MailToolModule = {
    definition: listLabelsDefinition,
    createHandler: createListLabelsHandler,
};
