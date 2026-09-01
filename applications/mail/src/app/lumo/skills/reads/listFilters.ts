import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { FILTER_STATUS } from '@proton/shared/lib/constants';

import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { serializeCatalogue } from './catalogue';

export interface FilterSummary {
    reference: string;
    name: string;
    enabled: boolean;
    sieve?: string;
}

export interface ListFiltersResult {
    filters: FilterSummary[];
}

export const listFiltersDefinition: ToolDefinition<Record<string, never>, ListFiltersResult> = {
    name: 'list_filters',
    kind: 'read',
    toolDescription:
        "List the user's mail filters — each with its filter-… reference, name, enabled/disabled state, and full Sieve script. Use when the user asks what filters exist or what one of them does. Read-only.",
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) =>
        serializeCatalogue(
            `${result.filters.length} filters:`,
            result.filters.map((filter) => {
                const head = `${filter.reference} | "${filter.name}" | ${filter.enabled ? 'enabled' : 'disabled'}`;
                return filter.sieve ? `${head}\n${filter.sieve}` : head;
            }),
            'The user has no filters.'
        ),
    summarizeChip: (_params, result) => {
        const count = result.filters.length;
        return { label: c('Info').ngettext(msgid`Read your ${count} filter`, `Read your ${count} filters`, count) };
    },
};

export const createListFiltersHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ListFiltersResult> =>
    async (_params, { references }) => ({
        filters: mail.getFilters().map((filter) => ({
            reference: references.referenceFor('filter', filter.ID, { title: filter.Name }),
            name: filter.Name,
            enabled: filter.Status === FILTER_STATUS.ENABLED,
            sieve: filter.Sieve,
        })),
    });

export const listFiltersModule: MailToolModule = {
    definition: listFiltersDefinition,
    createHandler: createListFiltersHandler,
};
