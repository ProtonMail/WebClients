import { c } from 'ttag';

import TextFieldBody from '@proton/components/components/lumoAgent/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import { FILTER_VERSION } from '@proton/components/containers/filters/constants';
import { IcFilter } from '@proton/icons/icons/IcFilter';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { PROTON_SIEVE_DIALECT_REFERENCE } from '../../guides/sieveGuide';
import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { referenceName } from '../organise/emailSelection';

/** Every editable param of this tool — and, because each is user words, every free-text one. */
export enum FilterField {
    NAME = 'name',
    SIEVE = 'sieve',
}

export interface UpdateFilterParams {
    /** A filter-… reference from list_filters. */
    filter: string;
    name: string;
    sieve: string;
}

export const updateFilterDefinition: ToolDefinition<UpdateFilterParams, void> = {
    name: 'update_filter',
    kind: 'mutation',
    toolDescription:
        'Replace an existing filter\'s name and Sieve script. `filter` is the filter-… reference from list_filters; `name` and `sieve` are the new values. Send the stored `name` back unchanged unless the user asked to rename the filter. The script REPLACES the stored one wholesale — it is never merged, so anything the filter should keep doing must be written out again in full. Read the current script with list_filters first and edit it, rather than sending only the new rule. A filter can only file into a folder that ALREADY exists — create the folder first (a separate confirmed step) if needed. NEEDS its guide loaded first (call load_guide with "update_filter") for the Sieve dialect. Proposed to the user for confirmation before it runs.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['filter', 'name', 'sieve'],
        properties: { filter: { type: 'string' }, name: { type: 'string' }, sieve: { type: 'string' } },
    },
    // The guard matches a WHOLE param value against `<kind>-<6 base36>`, so a name like "e-ticket" would
    // be rejected as an unknown reference. The script is exempt on the same principle — it is user text —
    // though being multi-line it cannot match that pattern today. `filter` stays guarded.
    freeTextParams: Object.values(FilterField),
    examples: [
        {
            context:
                'list_filters returned `filter-k9j8h7 | "Newsletters"` with a script filing news@example.com into Newsletters, and the user wants promos@example.com filed there too. The whole script is re-sent: the spam-guard prologue verbatim, `fileinto` merged into its require, and the existing rule alongside the new one. The name is unchanged because the user did not ask to rename it.',
            call: {
                filter: 'filter-k9j8h7',
                name: 'Newsletters',
                sieve: 'require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest", "fileinto"];\n\n# Generated: Do not run this script on spam messages\nif allof (environment :matches "vnd.proton.spam-threshold" "*",\nspamtest :value "ge" :comparator "i;ascii-numeric" "${1}")\n{\n    return;\n}\n\nif anyof (address :is "from" "news@example.com", address :is "from" "promos@example.com") {\n    fileinto "Newsletters";\n}',
            },
        },
    ],
    // Surfaced via the confirm card, not the working set, so this stays trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Update filter` }),
};

export const createUpdateFilterHandler =
    (mail: MailToolDeps): ToolHandler<UpdateFilterParams, void> =>
    async ({ filter, name, sieve }, { references }) => {
        const id = resolveTypedId(filter, ['filter'], references);
        const stored = mail.getFilters().find((candidate) => candidate.ID === id);
        if (!stored) {
            throw new ToolInputError(`Filter ${filter} no longer exists. Call list_filters for the current ones.`);
        }
        await mail.validateSieve(sieve);
        // The write replaces the whole filter, so `Status` comes from what is stored — taking it from the
        // model would let an update disable an enabled filter. `Version` is the dialect `validateSieve`
        // just checked against, NOT the stored one: a legacy v1 filter would otherwise be saved under a
        // grammar it was never validated for. The Sieve editor upgrades the same way (`convertModel`).
        await mail.updateFilter(stored.ID, {
            ID: stored.ID,
            Name: name,
            Status: stored.Status,
            Version: FILTER_VERSION,
            Sieve: sieve,
        });
    };

const fieldText = (params: Record<string, any>, field: FilterField): string => String(params[field] ?? '');

/** An emptied field would send a nameless or scriptless filter the backend rejects. */
const hasEveryFieldFilled = (params: Record<string, any>): boolean =>
    Object.values(FilterField).every((field) => fieldText(params, field).trim().length > 0);

const SIEVE_FIELD_ROWS = 10;

const renderFilterField = ({ params, onChange }: CardBodyProps, field: FilterField, label: string, rows?: number) => (
    <TextFieldBody
        label={label}
        value={fieldText(params, field)}
        onChange={(value) => onChange({ ...params, [field]: value })}
        rows={rows}
    />
);

export const updateFilterCardRenderer: CardRenderer = {
    icon: IcFilter,
    title: () => c('Title').t`Update filter`,
    subtitle: (action, labels) => referenceName(action.filter, labels),
    renderBody: (props) => (
        <>
            {renderFilterField(props, FilterField.NAME, c('Label').t`Filter name`)}
            {renderFilterField(props, FilterField.SIEVE, c('Label').t`Sieve script`, SIEVE_FIELD_ROWS)}
        </>
    ),
    canApply: hasEveryFieldFilled,
    detail: (action) => fieldText(action, FilterField.NAME) || undefined,
};

export const updateFilterModule: MailToolModule = {
    definition: updateFilterDefinition,
    createHandler: createUpdateFilterHandler,
    cardRenderer: updateFilterCardRenderer,
    createGuide: () => PROTON_SIEVE_DIALECT_REFERENCE,
};
