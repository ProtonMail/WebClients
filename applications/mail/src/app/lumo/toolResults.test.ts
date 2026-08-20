import type { ToolDefinition } from '@proton/llm/lib/lumoAgent/contracts/types';
import { LOAD_GUIDE_TOOL_NAME } from '@proton/llm/lib/lumoAgent/engine/loadGuide';

import { buildLumoMailConfig } from './registry';
import { applyLabelsDefinition } from './skills/organise/applyLabels';
import { createFolderDefinition, createLabelDefinition } from './skills/organise/createEntity';
import { moveEmailsDefinition } from './skills/organise/moveEmails';
import { setLocationReadDefinition } from './skills/organise/setLocationRead';
import { setReadDefinition } from './skills/organise/setRead';
import { setStarredDefinition } from './skills/organise/setStarred';
import { findContactsDefinition } from './skills/reads/findContacts';
import { listFiltersDefinition } from './skills/reads/listFilters';
import { listFoldersDefinition } from './skills/reads/listFolders';
import { listLabelsDefinition } from './skills/reads/listLabels';
import { openFolderDefinition } from './skills/reads/openFolder';
import { readEmailDefinition } from './skills/reads/readEmail';
import { readOpenEmailDefinition } from './skills/reads/readOpenEmail';
import { readThreadDefinition } from './skills/reads/readThread';
import type { AgentEmailRow } from './skills/reads/rows';
import { searchDefinition } from './skills/reads/search';
import { viewEmailsDefinition } from './skills/reads/viewEmails';
import type { MailToolDeps } from './toolModule';

const anyReferences = {} as any;

const row = (overrides: Partial<AgentEmailRow> = {}): AgentEmailRow => ({
    reference: 'email-a1b2c3',
    from: 'Alice',
    subject: 'Booking confirmation',
    date: '2026-07-01',
    unread: true,
    starred: false,
    folder: 'Inbox',
    labels: [],
    hasAttachment: false,
    ...overrides,
});

const email = { reference: 'email-a1b2c3', subject: 'Booking', from: 'Alice', date: '2026-07-01', body: 'Body' };

/** Every branch of every model-facing payload, hand-listed: the results have no shared shape to iterate. */
const payloads = <Result>(definition: ToolDefinition<any, Result>, results: Result[]) => ({
    name: definition.name,
    serialized: results.map((result) => definition.serializeForLumo(result, anyReferences).toLowerCase()),
});

const TOOL_PAYLOADS = [
    payloads(viewEmailsDefinition, [
        { rows: [], total: 0, bulkActionRunning: false },
        { rows: [], total: 0, bulkActionRunning: true },
        { rows: [row()], total: 12, bulkActionRunning: false },
    ]),
    payloads(openFolderDefinition, [
        { location: 'Spam', rows: [], total: 0, bulkActionRunning: false },
        { location: 'Inbox', rows: [], total: 0, bulkActionRunning: true },
        { location: 'Inbox', rows: [row()], total: 12, bulkActionRunning: false },
    ]),
    payloads(searchDefinition, [
        { query: 'all mail', coverage: 'full' as const, scope: '', rows: [], total: 0, bulkActionRunning: false },
        {
            query: '"ticket"',
            coverage: 'partial' as const,
            scope: 'Axes not used in this search: from.',
            rows: [],
            total: 0,
            bulkActionRunning: false,
        },
        {
            query: '"ticket"',
            coverage: 'metadata_only' as const,
            scope: 'Axes not used in this search: from, to, date range, folder or label. Spam and Trash were outside its scope.',
            rows: [],
            total: 0,
            bulkActionRunning: true,
        },
        {
            query: '"ticket"',
            coverage: 'unfinished' as const,
            scope: '',
            rows: [row()],
            total: 1,
            bulkActionRunning: false,
        },
    ]),
    payloads(readEmailDefinition, [
        { emails: [email] },
        { emails: [], notLoaded: ['email-a1b2c3'], notDecrypted: ['email-d4e5f6'] },
    ]),
    payloads(readOpenEmailDefinition, [{ isOpen: false }, { isOpen: true }, { isOpen: true, email }]),
    payloads(readThreadDefinition, [
        { found: false, messages: [], total: 0 },
        { found: true, messages: [], total: 0 },
        { found: true, subject: 'Booking', messages: [{ from: 'Alice', date: '2026-07-01', body: 'Body' }], total: 1 },
    ]),
    payloads(listFoldersDefinition, [
        { folders: [] },
        { folders: [{ reference: 'folder-x7b2q1', name: 'Travel', parent: null }] },
    ]),
    payloads(listLabelsDefinition, [
        { labels: [] },
        { labels: [{ reference: 'label-m3n4p5', name: 'Receipts', color: '#fff' }] },
    ]),
    payloads(listFiltersDefinition, [
        { filters: [] },
        { filters: [{ reference: 'filter-q1w2e3', name: 'Newsletters', enabled: true }] },
    ]),
    payloads(findContactsDefinition, [
        { query: 'ada', matches: [], total: 0, addressBookIsEmpty: true },
        { query: 'ada', matches: [], total: 0, addressBookIsEmpty: false },
        {
            query: 'ada',
            matches: [{ reference: 'contact-k9d2s1', name: 'Ada Lovelace', email: 'ada@example.com' }],
            total: 1,
            addressBookIsEmpty: false,
        },
        {
            query: null,
            matches: [{ reference: 'contact-k9d2s1', name: 'Ada Lovelace', email: 'ada@example.com' }],
            total: 60,
            addressBookIsEmpty: false,
        },
    ]),
    payloads(moveEmailsDefinition, [undefined]),
    payloads(setStarredDefinition, [undefined]),
    payloads(setReadDefinition, [undefined]),
    payloads(applyLabelsDefinition, [undefined]),
    payloads(setLocationReadDefinition, [undefined]),
    payloads(createFolderDefinition, [{ reference: 'folder-x7b2q1', name: 'Hotels' }]),
    payloads(createLabelDefinition, [{ reference: 'label-m3n4p5', name: 'Receipts' }]),
];

const DIRECTIVES = [
    'do not',
    'offer to',
    'ask the user',
    'use view_emails',
    'use search',
    'try again',
    'retry',
    'you must',
    'you should',
];

describe('a tool result describes what happened, and never directs the next step', () => {
    it.each(TOOL_PAYLOADS.map(({ name, serialized }) => [name, serialized] as const))('%s', (_name, serialized) => {
        serialized.forEach((payload) => {
            DIRECTIVES.forEach((directive) => {
                expect(payload).not.toContain(directive);
            });
        });
    });

    it('covers every registered tool', () => {
        const registered = buildLumoMailConfig({} as MailToolDeps)
            .definitions.map(({ name }) => name)
            .filter((name) => name !== LOAD_GUIDE_TOOL_NAME);

        expect(TOOL_PAYLOADS.map(({ name }) => name).sort()).toEqual(registered.sort());
    });
});
