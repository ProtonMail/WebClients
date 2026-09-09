import { c } from 'ttag';

import { FILTER_VERSION } from '@proton/components/containers/filters/constants';
import { IcFilter } from '@proton/icons/icons/IcFilter';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import { FILTER_STATUS, FREE_USER_ACTIVE_FILTERS_LIMIT } from '@proton/shared/lib/constants';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';

import { PROTON_SIEVE_DIALECT_REFERENCE } from '../../guides/sieveGuide';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { FilterField, hasEveryFilterFieldFilled, proposedFilterName, renderFilterFields } from './filterCard';

export interface CreateFilterParams {
    name: string;
    sieve: string;
}

/**
 * Both fields come from the filter the SERVER returned, which normalises the name — so they name something
 * that exists, and the model can chain "make the rule, now check it" without re-reading list_filters.
 */
export interface CreatedFilterResult {
    reference: string;
    name: string;
}

export const createFilterDefinition: ToolDefinition<CreateFilterParams, CreatedFilterResult> = {
    name: 'create_filter',
    kind: 'mutation',
    toolDescription:
        'Create a new filter — a rule the server applies to mail as it ARRIVES. `name` is the filter\'s name; `sieve` is the complete Sieve script. This is the tool for "make a rule", for "always" filing or flagging certain mail, and for anything about FUTURE mail; create_label, apply_labels and move_emails act only on mail that already exists. Call list_filters first: where an existing filter already covers the same ground, extend it with update_filter rather than adding a second one that competes with it. A filter can only file into a folder that ALREADY exists — create the folder first (a separate confirmed step) if needed. The new filter is created enabled. NEEDS its guide loaded first (call load_guide with "create_filter") for the Sieve dialect. Proposed to the user for confirmation before it runs.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'sieve'],
        properties: { name: { type: 'string' }, sieve: { type: 'string' } },
    },
    freeTextParams: Object.values(FilterField),
    examples: [
        {
            context:
                'The user wants their airline mail filed into Travel from now on. list_folders showed `Travel` already exists and list_filters returned nothing covering that sender, so a new filter is written rather than an existing one extended: the spam-guard prologue verbatim, and `fileinto` in the require line.',
            call: {
                name: 'Travel',
                sieve: 'require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest", "fileinto"];\n\n# Generated: Do not run this script on spam messages\nif allof (environment :matches "vnd.proton.spam-threshold" "*",\nspamtest :value "ge" :comparator "i;ascii-numeric" "${1}")\n{\n    return;\n}\n\nif address :is "from" "tickets@airline.example" {\n    fileinto "Travel";\n}',
            },
        },
        {
            context:
                'The user asks for mail "from Substack" to go to their existing Reading folder. They named the sender by brand, not by address, so the script matches a substring of the address: `address :is` would compare the whole address to the bare word and the filter would never fire.',
            call: {
                name: 'Substack',
                sieve: 'require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest", "fileinto"];\n\n# Generated: Do not run this script on spam messages\nif allof (environment :matches "vnd.proton.spam-threshold" "*",\nspamtest :value "ge" :comparator "i;ascii-numeric" "${1}")\n{\n    return;\n}\n\nif address :contains "from" "substack" {\n    fileinto "Reading";\n}',
            },
        },
    ],
    serializeForLumo: ({ reference, name }) => `Created filter ${reference} | "${name}".`,
    summarizeChip: () => ({ label: c('Info').t`Create filter` }),
};

const createFilterHandler =
    (mail: MailToolDeps): ToolHandler<CreateFilterParams, CreatedFilterResult> =>
    async ({ name, sieve }, { references }) => {
        // Gated before validating, so a blocked user is told why rather than shown a script they cannot save.
        if (hasReachedFiltersLimit(mail.getUser(), mail.getFilters())) {
            throw new ToolInputError(
                `The user has reached their plan's active-filter limit (${FREE_USER_ACTIVE_FILTERS_LIMIT}), so no new filter can be created. Tell them that, and offer update_filter to extend a filter they already have — you cannot delete or disable filters yourself.`
            );
        }
        await mail.validateSieve(sieve);
        // `ID` is required by CreateFilter but assigned by the endpoint. `Status` is not the model's to
        // choose — a filter it created disabled would silently do nothing — and the limit predicate counts
        // only enabled filters. `Version` is the dialect `validateSieve` just checked the script against.
        const created = await mail.addFilter({
            ID: '',
            Name: name,
            Status: FILTER_STATUS.ENABLED,
            Version: FILTER_VERSION,
            Sieve: sieve,
        });

        return {
            reference: references.referenceFor('filter', created.ID, { title: created.Name }),
            name: created.Name,
        };
    };

export const createFilterCardRenderer: CardRenderer = {
    icon: IcFilter,
    // translator: the name and script are the fields below, so the sentence names only the action
    sentence: () => c('Info').t`Create a filter`,
    renderBody: renderFilterFields,
    canApply: hasEveryFilterFieldFilled,
    detail: proposedFilterName,
};

export const createFilterModule: MailToolModule = {
    definition: createFilterDefinition,
    createHandler: createFilterHandler,
    cardRenderer: createFilterCardRenderer,
    createGuide: () => PROTON_SIEVE_DIALECT_REFERENCE,
};
