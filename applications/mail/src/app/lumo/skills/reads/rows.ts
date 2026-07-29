/**
 * Model-facing projections of the mailbox list: these build and serialise the rows the *agent* reads,
 * and are never used to render the UI. The list components remain the only thing that draws a row.
 */
import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { getDate, hasAttachments, isStarred, isUnread } from 'proton-mail/helpers/elements';
import { getCurrentFolders, getElementLabels } from 'proton-mail/helpers/labels';
import { getDisplayRecipients, getUniqueElementSenders } from 'proton-mail/helpers/recipients';
import type { Element } from 'proton-mail/models/element';
import {
    contextTotal as contextTotalSelector,
    elements as elementsSelector,
    selectConversationMode,
    selectPageSize,
    selectParams,
} from 'proton-mail/store/elements/elementsSelectors';

import type { MailToolDeps } from '../../toolModule';

/** One on-screen email, metadata only — the shared row shape every list-style read returns. */
export interface AgentEmailRow {
    /** Stable `email-…` reference for this element. */
    reference: string;
    from: string;
    subject: string;
    /** Local calendar date (YYYY-MM-DD) as the mailbox shows it, or ''. */
    date: string;
    unread: boolean;
    /** Whether the row is currently starred (so the model doesn't re-star an already-starred email). */
    starred: boolean;
    /** Folder display name the row currently sits in. */
    folder: string;
    /** Custom label display names on the row. */
    labels: string[];
    hasAttachment: boolean;
}

/** A page of on-screen rows plus the total in the view (which may exceed `rows.length`). */
export interface AgentEmailPage {
    rows: AgentEmailRow[];
    total: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * The row's date as a local calendar day, read through the mailbox's own date source — `getDate`
 * resolves a conversation's label-contextual time, and building the day from local parts keeps the
 * agent's date equal to the day on screen (a UTC serialisation shifts either side of midnight).
 * Assembled by hand rather than via date-fns `format`: this is a fixed machine format for the model,
 * so unlike display copy it must not vary with `dateLocale`.
 */
const toDate = (element: Element, labelID: string): string => {
    const date = getDate(element, labelID);
    if (date.getTime() === 0) {
        return '';
    }

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatSender = (recipients: (Recipient | undefined)[]): string => {
    const names = recipients.map((recipient) => recipient?.Name || recipient?.Address).filter(Boolean);
    return names.length ? names.join(', ') : '(unknown sender)';
};

const formatRow = (row: AgentEmailRow): string => {
    const parts = [row.reference, row.from, row.subject, row.date, row.unread ? 'unread' : 'read', row.folder];
    if (row.starred) {
        parts.push('starred');
    }
    if (row.labels.length) {
        parts.push(`labels: ${row.labels.join(', ')}`);
    }
    if (row.hasAttachment) {
        parts.push('has attachment');
    }
    return parts.join(' | ');
};

/**
 * Render a page of email rows as a compact, model-facing table with a count header. Returns '' when
 * empty, letting each caller supply its own "nothing here" wording. Pure — the rows are already built.
 */
export const formatAgentEmailRows = (rows: AgentEmailRow[], total: number): string => {
    if (!rows.length) {
        return '';
    }
    const notShown = total - rows.length;
    const header =
        notShown > 0
            ? `${rows.length} of ${total} emails shown (${notShown} more not shown):`
            : `${rows.length} emails shown:`;
    return [header, ...rows.map(formatRow)].join('\n');
};

/** The read-only slice of {@link MailToolDeps} a row projection needs — no `applyLocation`, no `history`. */
type RowDeps = Pick<MailToolDeps, 'store' | 'getFolders' | 'getLabels' | 'getMailSettings'>;

/**
 * Project the current on-screen page into {@link AgentEmailRow}s, minting a stable `email-…` reference
 * per element via the {@link ReferenceRegistry} (subject recorded as its display label). The page is
 * bounded by the mailbox's own page size (50/100/200) so the payload only ever describes what the user
 * can see, and `total` is the view's total so the model knows how much it is *not* seeing.
 *
 * Every field the mailbox also renders is derived through the helper the list components use, so the
 * agent can never describe a row differently from the row on screen.
 */
export const buildAgentEmailRows = (deps: RowDeps, references: ReferenceRegistry): AgentEmailPage => {
    const state = deps.store.getState();
    const { labelID } = selectParams(state);
    const conversationMode = selectConversationMode(state);
    const folders = deps.getFolders();
    const labels = deps.getLabels();
    const mailSettings = deps.getMailSettings();

    const allElements = elementsSelector(state);
    const total = contextTotalSelector(state) ?? allElements.length;
    const rows: AgentEmailRow[] = allElements.slice(0, selectPageSize(state)).map((element) => {
        const subject = element.Subject || '(no subject)';
        const senders = getUniqueElementSenders(element, conversationMode, getDisplayRecipients(element, labelID));
        return {
            reference: references.referenceFor('email', element.ID || '', subject),
            from: formatSender(senders),
            subject,
            date: toDate(element, labelID),
            unread: isUnread(element, labelID),
            starred: isStarred(element),
            folder: getCurrentFolders(element, labelID, folders, mailSettings)
                .map((info) => info.name)
                .join(', '),
            labels: getElementLabels(element, labelID, labels).map((label) => label.Name),
            hasAttachment: hasAttachments(element),
        };
    });

    return { rows, total };
};
