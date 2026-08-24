import { fromUnixTime, parseISO } from 'date-fns';
import { c, msgid } from 'ttag';

import DateTimeBody from '@proton/components/components/lumoAgent/cardBodies/DateTimeBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcClock } from '@proton/icons/icons/IcClock';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isValidDate } from '@proton/shared/lib/date/date';

import { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import { formatDateToHuman } from '../../../helpers/date';
import { getSnoozeUnixTime } from '../../../helpers/snooze';
import { selectParams } from '../../../store/elements/elementsSelectors';
import { resolveElements } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { emailIds, hasEmailSelection, renderEmailSelectionBody } from './emailSelection';

export interface SnoozeEmailsParams {
    ids: string[];
    /** ISO 8601 datetime, IN THE FUTURE, when the emails should return to the top of the inbox. */
    wake_at: string;
}

const isFuture = (date: Date, nowMs: number = Date.now()): boolean => date.getTime() > nowMs;

/**
 * `parseISO`, not `Date.parse`: it is what {@link DateTimeBody} writes the param with, so the card and this
 * backstop accept exactly the same values, and `Date.parse` would also admit engine-specific formats the
 * schema calls invalid. Mail's own future-time rule is a hook re-checking on an interval
 * (`useFutureTimeDate`), so it cannot run in a handler — injecting the clock keeps this pure instead.
 */
export const resolveWakeAt = (wakeAt: string, nowMs: number = Date.now()): Date => {
    const parsed = parseISO(wakeAt);
    if (!isValidDate(parsed)) {
        throw new ToolInputError(
            `Could not read the wake time "${wakeAt}". Send an absolute ISO 8601 datetime (e.g. "2026-07-12T09:00:00").`
        );
    }
    if (!isFuture(parsed, nowMs)) {
        throw new ToolInputError(`The wake time "${wakeAt}" is in the past. Snooze needs a future time.`);
    }
    return parsed;
};

/**
 * `useSnooze` offers snooze only from the Inbox in conversation view but its `snooze()` re-checks nothing:
 * elsewhere it would label mail SNOOZED that the location never surfaces again, and in message view it hands
 * message ids to an endpoint that expects conversation ids.
 */
export const assertSnoozeAvailable = (labelID: string, conversationMode: boolean): void => {
    if (labelID !== MAILBOX_LABEL_IDS.INBOX) {
        throw new ToolInputError(
            'Snooze only works on mail in the Inbox. Open the Inbox with open_folder, then snooze the emails from there.'
        );
    }
    if (!conversationMode) {
        throw new ToolInputError(
            'Snooze needs conversation view and this mailbox is in message view, so it cannot be done: tell the user snooze is unavailable in message view.'
        );
    }
};

export const snoozeEmailsDefinition: ToolDefinition<SnoozeEmailsParams, void> = {
    name: 'snooze_emails',
    kind: 'mutation',
    toolDescription:
        'Snooze one or more emails: they leave the inbox now and return to the top of it at a future time. `ids` are email-… references from view_emails/search. `wake_at` is an ISO 8601 datetime IN THE FUTURE when they should come back. Resolve the user\'s natural language ("tomorrow at 8am", "Saturday morning") to an absolute datetime yourself from the current date. If they do NOT give a time, do NOT ask for one: propose tomorrow at 9am — the confirm card shows an EDITABLE date and time, so the user adjusts it there before applying. Only works on mail sitting in the INBOX, and only while the mailbox shows conversations rather than single messages — elsewhere it is refused, so read the Inbox with open_folder or view_emails first and snooze what you find there. Proposed to the user for confirmation before it runs. Example: { "ids": ["email-a1b2c3"], "wake_at": "2026-07-12T09:00:00" }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'wake_at'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            wake_at: { type: 'string' },
        },
    },
    examples: [
        {
            context:
                'view_emails returned email-a1b2c3 and today is Thursday 2026-07-09. The user says "snooze this until Saturday morning".',
            call: { ids: ['email-a1b2c3'], wake_at: '2026-07-11T09:00:00' },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Snooze emails` }),
};

export const createSnoozeEmailsHandler =
    (mail: MailToolDeps): ToolHandler<SnoozeEmailsParams, void> =>
    async ({ ids, wake_at }, { references }) => {
        const snoozeTime = resolveWakeAt(wake_at);
        const { labelID, conversationMode } = selectParams(mail.store.getState());
        assertSnoozeAvailable(labelID, conversationMode);
        const elements = resolveElements(mail.store, ids, references);
        await mail.snooze({ elements, duration: 'custom', snoozeTime }, SOURCE_ACTION.TOOLBAR);
    };

/** Mail's own "Tomorrow" snooze option, so the proposal lands on the same instant the mailbox's menu does. */
const tomorrowMorning = () => fromUnixTime(getSnoozeUnixTime('tomorrow'));

/** Formats via the same helper as Mail's own "Snoozed until …" banner, so both surfaces read alike. Only the
 *  settled tile may show it: `ConfirmCard` builds `subtitle` from the PROPOSED action while the body edits
 *  `params`, so a pending wake time there would contradict the picker beneath it. Confirming swaps the applied
 *  params into the item's action, which is why the tile can be trusted and a subtitle could not. */
const wakeAtLabel = (action: ActionRequest): string => {
    const wakeAt = parseISO(String(action.wake_at));
    if (!isValidDate(wakeAt)) {
        return '';
    }
    const { dateString, formattedTime } = formatDateToHuman(wakeAt);
    // translator: when a snoozed email returns to the inbox, e.g. "Saturday, July 11th, 2026 at 9:00 AM"
    return c('Info').t`${dateString} at ${formattedTime}`;
};

const renderSnoozeBody = (props: CardBodyProps) => (
    <>
        {renderEmailSelectionBody(props)}
        <DateTimeBody
            params={props.params}
            onChange={props.onChange}
            fields={[
                {
                    param: 'wake_at',
                    dateLabel: c('Label').t`Return on`,
                    timeLabel: c('Label').t`At`,
                    fallback: tomorrowMorning,
                    accepts: isFuture,
                },
            ]}
        />
    </>
);

/** Either half of the body can make the change unapplyable: nothing selected, or a wake time the handler
 *  would throw on. Disabling Confirm keeps the user off an error the model would then have to recover from. */
const canApplySnooze = (params: Record<string, any>): boolean => {
    if (!hasEmailSelection(params)) {
        return false;
    }
    try {
        resolveWakeAt(params.wake_at);
        return true;
    } catch {
        return false;
    }
};

export const snoozeEmailsCardRenderer: CardRenderer = {
    icon: IcClock,
    title: () => c('Title').t`Snooze emails`,
    renderBody: renderSnoozeBody,
    canApply: canApplySnooze,
    detail: (action) => {
        const count = emailIds(action).length;
        const wakeTime = wakeAtLabel(action);
        return c('Snooze info').ngettext(msgid`${count} email → ${wakeTime}`, `${count} emails → ${wakeTime}`, count);
    },
};

export const snoozeEmailsModule: MailToolModule = {
    definition: snoozeEmailsDefinition,
    createHandler: createSnoozeEmailsHandler,
    cardRenderer: snoozeEmailsCardRenderer,
};
