import { addDays, getUnixTime, parseISO, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { buildMailSearchGuide } from '../../guides/searchGuide';
import { filterHashFor, navigateAndReadRows, resolveMailboxLocation } from '../../helpers/navigation';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import type { ContentSearchCoverage } from './contentSearch';
import { CONTENT_SEARCH_NOTES, resolveContentSearchCoverage } from './contentSearch';
import type { MailboxFilter } from './mailboxView';
import { resolveMailboxFilter } from './mailboxView';
import type { AgentEmailRow } from './rows';
import { formatAgentEmailRows } from './rows';

const FILTER_DESCRIPTIONS: Record<MailboxFilter, string> = {
    read: 'read',
    unread: 'unread',
    has_attachment: 'has attachment',
};

export interface SearchParams {
    keyword: string | null;
    from: string | null;
    to: string | null;
    target: string | null;
    begin: string | null;
    end: string | null;
    filter: string | null;
}

const SEARCH_FREE_TEXT_PARAMS = ['keyword', 'from', 'to', 'begin', 'end', 'filter'] as const;

export interface SearchResult {
    query: string;
    /** The searched folder/label's NAME, never its reference — this reaches the user's chip. */
    targetName?: string;
    /** How much of the mailbox this device's index let the search actually cover. */
    coverage: ContentSearchCoverage;
    /** Which axes this search left unused, and whether Spam/Trash were in scope. */
    scope: string;
    rows: AgentEmailRow[];
    /** May exceed `rows.length`. */
    total: number;
}

export const toSearchBound = (iso: string, inclusiveEnd = false): string => {
    const day = startOfDay(parseISO(iso));
    if (Number.isNaN(day.getTime())) {
        throw new ToolInputError(`Could not read the date "${iso}". Use an ISO date, e.g. 2026-07-29.`);
    }
    return String(getUnixTime(inclusiveEnd ? addDays(day, 1) : day));
};

/** Takes the VALIDATED filter, not the raw param, so the description matches what is on screen. */
export const describeSearch = (
    params: SearchParams,
    { filter }: { filter?: MailboxFilter },
    targetName?: string
): string => {
    const parts: string[] = [];
    if (params.keyword) {
        parts.push(`"${params.keyword}"`);
    }
    if (params.from) {
        parts.push(`from:${params.from}`);
    }
    if (params.to) {
        parts.push(`to:${params.to}`);
    }
    if (filter) {
        parts.push(FILTER_DESCRIPTIONS[filter]);
    }
    // Both bounds are inclusive whole days, so "from"/"to" rather than "after"/"before" — the model
    // relays this phrasing to the user, and "before 29 July" would exclude the day we in fact searched.
    if (params.begin) {
        parts.push(`from ${params.begin}`);
    }
    if (params.end) {
        parts.push(`to ${params.end}`);
    }
    if (targetName) {
        parts.push(`in ${targetName}`);
    }
    return parts.join(', ') || 'all mail';
};

const SEARCH_AXES: { label: string; isUnused: (params: SearchParams) => boolean }[] = [
    { label: 'keyword', isUnused: ({ keyword }) => !keyword },
    { label: 'from', isUnused: ({ from }) => !from },
    { label: 'to', isUnused: ({ to }) => !to },
    { label: 'date range', isUnused: ({ begin, end }) => !begin && !end },
    { label: 'folder or label', isUnused: ({ target }) => !target },
];

export const describeSearchScope = (params: SearchParams, spamTrashExcluded: boolean): string => {
    const unused = SEARCH_AXES.filter(({ isUnused }) => isUnused(params)).map(({ label }) => label);
    const notes: string[] = [];
    if (unused.length) {
        notes.push(`Axes not used in this search: ${unused.join(', ')}.`);
    }
    if (spamTrashExcluded) {
        notes.push('Spam and Trash were outside its scope.');
    }
    return notes.join(' ');
};

/**
 * The chip the USER reads, so: whole translated sentences (never glued fragments), and the folder/label's
 * name rather than its reference. The model gets the full query through {@link describeSearch} instead.
 */
export const searchChipLabel = (params: SearchParams, targetName?: string): string => {
    // Renamed rather than read off `params` inline: ttag interpolations must be plain identifiers.
    const { keyword, from: sender, to: recipient } = params;
    if (keyword) {
        return c('Info').t`Searched for “${keyword}”`;
    }
    if (sender) {
        return c('Info').t`Searched for mail from ${sender}`;
    }
    if (recipient) {
        return c('Info').t`Searched for mail to ${recipient}`;
    }
    if (targetName) {
        return c('Info').t`Searched ${targetName}`;
    }
    return c('Info').t`Searched your mail`;
};

const nullableString = { type: ['string', 'null'] } as const;

export const searchDefinition: ToolDefinition<SearchParams, SearchResult> = {
    name: 'search',
    kind: 'read',
    needsGuide: true,
    // Deliberately short: every parameter, the query syntax and the Encrypted-Search caveats live in the
    // guide, which is in context whenever this tool is (a guided tool is only advertised once loaded).
    toolDescription:
        'Find emails anywhere in the mailbox and bring the matches on-screen, returning the matching rows (metadata only — no bodies), then read the best one with read_email. Use when the target email is not already on screen; if the user simply names a location in the left panel, use open_folder instead. NEEDS its guide loaded first (call load_guide with "search").',
    freeTextParams: SEARCH_FREE_TEXT_PARAMS,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['keyword', 'from', 'to', 'target', 'begin', 'end', 'filter'],
        properties: {
            keyword: nullableString,
            from: nullableString,
            to: nullableString,
            target: nullableString,
            begin: nullableString,
            end: nullableString,
            filter: nullableString,
        },
    },
    examples: [
        {
            context:
                'The user asks whether their subscription renewal has been billed yet. You do not know the wording their emails use, so the first search is a probe: the single most likely word, phrased as broadly as the guide allows for this device. Look at what comes back, then narrow by sender or date.',
            call: {
                keyword: 'invoice',
                from: null,
                to: null,
                target: null,
                begin: null,
                end: null,
                filter: null,
            },
        },
        {
            context:
                'The user asks for everything from a named sender in a given month. Both parts are metadata, which always matches, so there is nothing to guess — set from and the date range and leave keyword null. Adding the sender name to keyword as well would only narrow it, and can return nothing.',
            call: {
                keyword: null,
                from: 'Sam',
                to: null,
                target: null,
                begin: '2026-07-01',
                end: '2026-07-31',
                filter: null,
            },
        },
    ],
    serializeForLumo: (result) => {
        const rows = formatAgentEmailRows(result.rows, result.total) || 'No emails matched this search.';
        return [`Search results for (${result.query}):\n${rows}`, CONTENT_SEARCH_NOTES[result.coverage], result.scope]
            .filter(Boolean)
            .join('\n\n');
    },
    summarizeChip: (params, result) => ({ label: searchChipLabel(params, result.targetName) }),
};

export const createSearchHandler =
    (mail: MailToolDeps): ToolHandler<SearchParams, SearchResult> =>
    async (params, { references }) => {
        const { target } = params;

        const filter = resolveMailboxFilter(params.filter);

        // Shared with open_folder so an unscoped search lands on the SAME "all mail" the user's own search
        // does — which is Almost-all-mail (no Spam/Trash) when they have that setting on.
        const { labelID, pathname } = resolveMailboxLocation(
            target ? { target } : { location: 'all_mail' },
            references,
            mail.getMailSettings()
        );
        // Not the resolver's `name`, which falls back to a raw id — this reaches the user's chip.
        const targetName = target ? references.labelFor(target) : undefined;

        const { rows, total, settled, usedEncryptedSearch } = await navigateAndReadRows(mail, references, {
            pathname,
            labelID,
            query: {
                keyword: params.keyword ?? undefined,
                from: params.from ?? undefined,
                to: params.to ?? undefined,
                begin: params.begin ? toSearchBound(params.begin) : undefined,
                end: params.end ? toSearchBound(params.end, true) : undefined,
                filter: filterHashFor(filter),
            },
        });

        return {
            query: describeSearch(params, { filter }, targetName),
            targetName,
            // ES's React state, so it must be read here and not inside the settle subscription.
            coverage: resolveContentSearchCoverage({ esStatus: mail.getESStatus(), usedEncryptedSearch, settled }),
            scope: describeSearchScope(params, labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL),
            rows,
            total,
        };
    };

export const searchModule: MailToolModule = {
    definition: searchDefinition,
    createHandler: createSearchHandler,
    createGuide: (mail) => buildMailSearchGuide(mail.getESStatus()),
};
