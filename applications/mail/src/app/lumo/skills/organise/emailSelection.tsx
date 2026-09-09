import type { ReactNode } from 'react';

import { isValid, parseISO } from 'date-fns';
import { c, msgid } from 'ttag';

import type { ActionRequest, ReferenceLabel, ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardBodyProps } from '@proton/llm/lib/lumoAgent/ui/types';
import { MoveItemsCard } from '@proton/lumo-ui';
import type { CheckListItem } from '@proton/lumo-ui/primitives/ItemCheckList';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import { formatSimpleDate } from '../../../helpers/date';

export const referenceName = (reference: unknown, labels: ReferenceLabels): string => {
    const key = String(reference);
    return labels[key]?.title ?? key;
};

/**
 * The recorded name, or nothing when the session never recorded one. A card's sentence needs this rather
 * than {@link referenceName}: falling back to the reference itself puts `folder-x7b2q1`, or `undefined`
 * for a missing param, in the line the user approves.
 */
export const recordedName = (reference: unknown, labels: ReferenceLabels): string | undefined =>
    labels[String(reference)]?.title;

export const emailIds = (source: ActionRequest | Record<string, any>): string[] => (source.ids as string[]) ?? [];

/**
 * A reference's `meta` is the model-facing ISO date (CLAUDE.md §6), so the row formats it for a human
 * here — the same way the mailbox list formats its own dates.
 */
const rowDate = (meta: string | undefined): string | undefined => {
    if (!meta) {
        return undefined;
    }
    const parsed = parseISO(meta);

    return isValid(parsed) ? formatSimpleDate(parsed) : undefined;
};

/**
 * A row leads with the sender and carries the subject beneath, like the mailbox itself. A reference
 * records them the other way round — its `title` is the subject, because that is what the model refers
 * to an email by — so the two lines swap here rather than in the reference.
 */
const emailRow = (id: string, label: ReferenceLabel | undefined): CheckListItem => ({
    id,
    label: label?.subtitle ?? label?.title ?? id,
    subtitle: label?.subtitle ? label.title : undefined,
    meta: rowDate(label?.meta),
});

/** Renders the full proposed set, not just the selection, so a deselected row can be re-ticked. */
export const renderEmailSelectionBody = ({ action, params, labels, onChange }: CardBodyProps) => {
    const selectedIds = emailIds(params);

    return (
        <MoveItemsCard
            items={emailIds(action).map((id) => emailRow(id, labels[id]))}
            selectedIds={selectedIds}
            onToggle={(id, checked) =>
                onChange({ ...params, ids: checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id) })
            }
        />
    );
};

/** Deselecting every row leaves nothing to apply, so Confirm is disabled rather than settling on a no-op. */
export const hasEmailSelection = (params: Record<string, any>): boolean => emailIds(params).length > 0;

/** How many emails an action covers, in words — the subject of a card's sentence and of its settled tile. */
const emailCount = (count: number): string => c('Info').ngettext(msgid`${count} email`, `${count} emails`, count);

/**
 * The sentence every selection card leads with. The count is the SELECTION, not the proposal: the card
 * hands this the params the user is looking at, so deselecting a row changes the sentence, and an empty
 * selection stops the card claiming an action at all (Confirm is already off — see
 * {@link hasEmailSelection}). Callers supply the phrasing around the count and nothing else.
 */
export const emailSelectionSentence = (action: ActionRequest, phrase: (emails: ReactNode) => ReactNode): ReactNode => {
    const count = emailIds(action).length;
    if (!count) {
        return c('Info').t`No emails selected`;
    }

    // translator: the emphasised subject of a confirm card's sentence, e.g. "Move 3 emails to Travel"
    return phrase(sentenceValue(emailCount(count)));
};

/**
 * The settled tile's detail for a tool whose only variable is how many emails it touched: a count, never
 * the joined subjects, which are unbounded on a large selection. The card body already lists them by name.
 * An empty selection has nothing to disclose, so the tile renders without a chevron rather than offering
 * to reveal "0 emails".
 */
export const emailCountDetail = (action: ActionRequest): string | undefined => {
    const count = emailIds(action).length;
    if (!count) {
        return undefined;
    }

    return emailCount(count);
};
