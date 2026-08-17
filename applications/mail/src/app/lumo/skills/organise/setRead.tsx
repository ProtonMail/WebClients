import { c, msgid } from 'ttag';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { selectParams } from 'proton-mail/store/elements/elementsSelectors';

import { resolveElements } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { emailIds, hasEmailSelection, renderEmailSelectionBody } from './emailSelection';

export interface SetReadParams {
    ids: string[];
    /** Target state, not a toggle: true marks read, false marks unread. */
    read: boolean;
}

export const setReadDefinition: ToolDefinition<SetReadParams, void> = {
    name: 'set_read',
    kind: 'mutation',
    toolDescription:
        'Mark one or more emails as read or unread. `ids` are email-… references from view_emails/search. Set `read` to true for "mark these as read", or false for "mark these as unread". This SETS that state rather than toggling it, so it is safe on a mixed selection. Every on-screen row shows its current state as either `read` or `unread`, so only pass emails that are not already in the state you are setting — if every email the user means is already in it, tell them there is nothing to do instead of proposing this. This only changes the read/unread status: it does not star, move or label (use set_starred/move_emails/apply_labels for those). This acts ONLY on the specific emails you pass — to mark an entire folder or label, including mail that is not on screen, use set_location_read instead. Proposed to the user for confirmation before it runs.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'read'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            read: { type: 'boolean' },
        },
    },
    examples: [
        {
            context:
                'view_emails returned `email-a1b2c3 | Acme | Booking confirmation | 2026-08-11 | unread | Inbox` and `email-d4e5f6 | Acme | Receipt | 2026-08-11 | read | Inbox`. The user asks to mark both as read; the receipt already shows `read`, so only the other one is proposed.',
            call: { ids: ['email-a1b2c3'], read: true },
        },
        {
            context:
                'The same rows are on screen and the user asks to mark the receipt as unread. It shows `read`, so it is the only one that needs changing.',
            call: { ids: ['email-d4e5f6'], read: false },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: ({ read }) => ({
        label: read ? c('Info').t`Mark as read` : c('Info').t`Mark as unread`,
    }),
};

export const createSetReadHandler =
    (mail: MailToolDeps): ToolHandler<SetReadParams, void> =>
    async ({ ids, read }, { references }) => {
        const elements = resolveElements(mail.store, ids, references);
        // `silent` — Lumo's result tile already reports the outcome, so the hook's notification would double
        // up. `labelID` is the view the mark happens in, which is what decides a conversation's read state.
        await mail.markAs({
            elements,
            status: read ? MARK_AS_STATUS.READ : MARK_AS_STATUS.UNREAD,
            silent: true,
            labelID: selectParams(mail.store.getState()).labelID,
            sourceAction: SOURCE_ACTION.TOOLBAR,
        });
    };

/** No subtitle: there is no destination to show — the direction is in the title. */
export const setReadCardRenderer: CardRenderer = {
    icon: IcEnvelope,
    title: (action) => (action.read ? c('Title').t`Mark as read` : c('Title').t`Mark as unread`),
    renderBody: renderEmailSelectionBody,
    canApply: hasEmailSelection,
    // A count rather than the joined subjects, which is unbounded on a large selection; the card body
    // already lists them by name.
    detail: (action) => {
        const count = emailIds(action).length;
        return c('Info').ngettext(msgid`${count} email`, `${count} emails`, count);
    },
};

export const setReadModule: MailToolModule = {
    definition: setReadDefinition,
    createHandler: createSetReadHandler,
    cardRenderer: setReadCardRenderer,
};
