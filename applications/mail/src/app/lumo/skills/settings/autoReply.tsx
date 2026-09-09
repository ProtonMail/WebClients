import { useState } from 'react';

import { addWeeks, fromUnixTime, getUnixTime, isValid, parseISO } from 'date-fns';
import { c } from 'ttag';

import { getMatchingTimezone } from '@proton/components/containers/autoReply/utils';
import { IcClockPaperPlane } from '@proton/icons/icons/IcClockPaperPlane';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { DateTimeFieldSpec } from '@proton/llm/lib/lumoAgent/ui/cardBodies/DateTimeBody';
import DateTimeBody from '@proton/llm/lib/lumoAgent/ui/cardBodies/DateTimeBody';
import SettingsLinkBody from '@proton/llm/lib/lumoAgent/ui/cardBodies/SettingsLinkBody';
import TextFieldBody from '@proton/llm/lib/lumoAgent/ui/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import { toText } from '@proton/mail/helpers/parserHtml';
import { htmlEntities, replaceLineBreaks } from '@proton/mail/helpers/string';
import { AutoReplyDuration } from '@proton/shared/lib/constants';
import { getTimeZoneOptions, getTimezone } from '@proton/shared/lib/date/timezone';
import type { AutoResponder } from '@proton/shared/lib/interfaces';

import { formatLocalDateTime } from '../../helpers/formatting';
import { truncateBody } from '../../helpers/messages';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

/** Every param carrying the model's own words — so, per the reference guard, every free-text one. */
enum AutoReplyField {
    MESSAGE = 'message',
    SUBJECT = 'subject',
    START = 'start',
    END = 'end',
}

/** Untranslated, matching the account vacation-responder form: people doing international business
 *  would not want it translated, and it is not editable here. */
const DEFAULT_SUBJECT = 'Auto';

const MESSAGE_FIELD_ROWS = 5;

export interface SetAutoReplyParams {
    /** ON configures AND enables the away message; OFF disables it, keeping the stored text and window. */
    enabled: boolean;
    /** Plain text. Required when enabling, null when disabling. */
    message: string | null;
    subject: string | null;
    /** ISO 8601 datetime the away period starts, or null for "now". */
    start: string | null;
    /** ISO 8601 datetime it ends, or null for one week after the start. */
    end: string | null;
}

/**
 * The normalised call the handler acts on. Disabling carries nothing but the flag — the handler keeps
 * the stored message and window — while enabling carries the whole validated away message.
 */
export type ResolvedAutoReply =
    { enabled: false } | { enabled: true; message: string; subject: string; startMs: number; endMs: number };

export type SetAutoReplyResult = { enabled: false } | { enabled: true; startMs: number; endMs: number };

/**
 * The detail fields are null when no responder has ever been configured, and are still reported when one
 * is stored but off — that is what lets the model say what is already there before re-enabling it.
 */
export interface ReadAutoReplyResult {
    enabled: boolean;
    /** Null when no responder has ever been configured. Only FIXED carries a window. */
    repeat: AutoReplyDuration | null;
    message: string | null;
    subject: string | null;
    startMs: number | null;
    endMs: number | null;
}

/** `parseISO` rather than `Date.parse`, so this and the card's own parse read a date-only string the same way. */
const parseDatetimeMs = (value: string): number | undefined => {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed.getTime() : undefined;
};

const oneWeekAfter = (startMs: number): number => addWeeks(new Date(startMs), 1).getTime();

/** The window the card shows and the handler applies when the model supplied no times. */
export const defaultWindowMs = (start: string | null, nowMs: number): { startMs: number; endMs: number } => {
    const startMs = (start ? parseDatetimeMs(start) : undefined) ?? nowMs;
    return { startMs, endMs: oneWeekAfter(startMs) };
};

/**
 * Validate and normalise a set_auto_reply call without the store, so the window rules are testable and
 * the card can apply exactly the rules the handler will. Disabling short-circuits: it needs neither a
 * message nor a window. The clock is injected rather than read.
 */
export const resolveAutoReply = (params: SetAutoReplyParams, nowMs: number): ResolvedAutoReply => {
    if (!params.enabled) {
        return { enabled: false };
    }

    const message = params.message?.trim();
    if (!message) {
        throw new ToolInputError(
            'An auto-reply needs a message to send while the user is away — send it in `message`, using the wording the user gave.'
        );
    }

    const parseField = (field: AutoReplyField.START | AutoReplyField.END, value: string): number => {
        const ms = parseDatetimeMs(value);
        if (ms === undefined) {
            throw new ToolInputError(
                `Could not read the auto-reply \`${field}\` time "${value}". Send an absolute ISO 8601 datetime, e.g. "2026-07-13T09:00:00".`
            );
        }
        return ms;
    };

    const startMs = params.start ? parseField(AutoReplyField.START, params.start) : nowMs;
    const endMs = params.end ? parseField(AutoReplyField.END, params.end) : oneWeekAfter(startMs);
    if (endMs <= startMs) {
        throw new ToolInputError('The auto-reply `end` time must be after its `start` time.');
    }
    // A window that has already closed stores a responder the server would never fire — silently useless.
    if (endMs <= nowMs) {
        throw new ToolInputError(
            'The auto-reply `end` time is in the past, so the away message would never be sent. Send a window that ends in the future.'
        );
    }

    return { enabled: true, message, subject: params.subject?.trim() || DEFAULT_SUBJECT, startMs, endMs };
};

const describeWindow = (startMs: number, endMs: number): string =>
    `from ${formatLocalDateTime(new Date(startMs))} to ${formatLocalDateTime(new Date(endMs))}`;

const REPEAT_SCHEDULES: Record<AutoReplyDuration, string> = {
    [AutoReplyDuration.FIXED]: 'over a fixed date range',
    [AutoReplyDuration.DAILY]: 'repeating every day',
    [AutoReplyDuration.WEEKLY]: 'repeating every week',
    [AutoReplyDuration.MONTHLY]: 'repeating every month',
    [AutoReplyDuration.PERMANENT]: 'permanently, with no end date',
};

export const readAutoReplyDefinition: ToolDefinition<Record<string, never>, ReadAutoReplyResult> = {
    name: 'read_auto_reply',
    kind: 'read',
    toolDescription:
        "Read whether the user's automatic away message (out-of-office / vacation responder) is currently ON or OFF, and — when one is stored — its message, subject and away window. Call this before turning the away message ON, so you can surface the stored window and message. You do not need it to turn the away message OFF — set_auto_reply checks the stored state itself. Returns settings metadata only, no emails.",
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        const schedule = result.repeat === null ? '' : ` ${REPEAT_SCHEDULES[result.repeat]}`;
        const range =
            result.startMs !== null && result.endMs !== null ? ` ${describeWindow(result.startMs, result.endMs)}` : '';
        const subject = result.subject ? ` Subject "${result.subject}".` : '';
        const message = result.message ? ` Message:\n${truncateBody(result.message)}` : ' No message is stored.';
        return `Auto-reply is ${result.enabled ? 'ON' : 'OFF'}${schedule}${range}.${subject}${message}`;
    },
    summarizeChip: () => ({ label: c('Info').t`Read your auto-reply` }),
};

/** Epoch seconds in the store, milliseconds in the tool. An unset time is stored as 0, not as absent. */
const toMs = (seconds: number | undefined): number | null => (seconds ? fromUnixTime(seconds).getTime() : null);

const createReadAutoReplyHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ReadAutoReplyResult> =>
    async () => {
        const stored = mail.getMailSettings().AutoResponder;
        // Only a FIXED responder stores absolute epochs; the recurring kinds store seconds-of-day, which
        // read back as 1970 dates.
        const hasFixedWindow = stored?.Repeat === AutoReplyDuration.FIXED;
        return {
            enabled: !!stored?.IsEnabled,
            repeat: stored?.Repeat ?? null,
            // Lossy for a rich-text responder, which is acceptable: this read exists so the model can say
            // what is already set, not to round-trip it.
            message: stored?.Message ? toText(stored.Message).trim() : null,
            subject: stored?.Subject || null,
            startMs: hasFixedWindow ? toMs(stored.StartTime) : null,
            endMs: hasFixedWindow ? toMs(stored.EndTime) : null,
        };
    };

export const setAutoReplyDefinition: ToolDefinition<SetAutoReplyParams, SetAutoReplyResult> = {
    name: 'set_auto_reply',
    kind: 'mutation',
    toolDescription:
        "Turn the user's automatic away message (out-of-office / vacation responder) ON or OFF. This is a SETTING — the server sends the away message; it is NOT you sending or replying to an email. Never decide for yourself that the away message is already in the state asked for and answer in prose instead: always call, and this tool refuses a no-op and tells you what was stored. A DIFFERENT message or window is a real change. Read read_auto_reply first only when turning it ON, to surface the stored message and window. `enabled` chooses the direction: true configures AND enables the away message, false turns it OFF (pass null for `message`, `subject`, `start` and `end` — the stored message and window are kept so it can be re-enabled later). When enabling, `message` is the away text as plain text and is REQUIRED: use the user's own wording and do NOT invent it — ask them if they have not said. `subject` is the auto-reply subject, or null for a default. `start` and `end` are ISO 8601 datetimes bounding the away period: resolve the user's natural language (\"from Monday until next Friday\") to absolute datetimes yourself from the current date, or pass null to default to now and one week later. The window must end in the future. This can only set a fixed date range: if read_auto_reply reports a recurring or permanent responder, tell the user that calling this replaces their schedule with the window you set, and let them decide. The confirm card shows the message and the window and lets the user adjust them and reach advanced options, so do not mention or link to settings yourself. Requires a paid Mail plan. Proposed to the user for confirmation before it runs.",
    // Nullable rather than optional, because a schema cannot express "required only when `enabled` is
    // true" — that half of the contract lives in `resolveAutoReply`.
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['enabled', 'message', 'subject', 'start', 'end'],
        properties: {
            enabled: { type: 'boolean' },
            message: { type: ['string', 'null'] },
            subject: { type: ['string', 'null'] },
            start: { type: ['string', 'null'] },
            end: { type: ['string', 'null'] },
        },
    },
    // The guard matches a WHOLE param value against `<kind>-<6 base36>`, so a subject like "out-office"
    // would be rejected as an unknown reference. That leaves only `enabled`, which is a boolean.
    freeTextParams: Object.values(AutoReplyField),
    examples: [
        {
            context:
                'Today is 2026-07-09 and the user says "turn on an away message until next Monday saying I\'m on leave". read_auto_reply reported it OFF.',
            call: {
                enabled: true,
                message: "I'm on leave with limited access to my email and will reply when I'm back.",
                subject: null,
                start: '2026-07-09T09:00:00',
                end: '2026-07-13T09:00:00',
            },
        },
        {
            context: 'The user says "turn off my out of office", and read_auto_reply reported it ON.',
            call: { enabled: false, message: null, subject: null, start: null, end: null },
        },
    ],
    serializeForLumo: (result) =>
        result.enabled
            ? `Auto-reply is now ON, ${describeWindow(result.startMs, result.endMs)}.`
            : 'Auto-reply is now OFF.',
    summarizeChip: (params) => ({
        label: params.enabled ? c('Info').t`Set auto-reply` : c('Info').t`Turn off auto-reply`,
    }),
};

/** What makes two enabled fixed-range responders the same proposal — the rest of the record is constant. */
const isSameResponder = (stored: AutoResponder, next: AutoResponder): boolean =>
    stored.Message === next.Message &&
    stored.Subject === next.Subject &&
    stored.StartTime === next.StartTime &&
    stored.EndTime === next.EndTime;

const createSetAutoReplyHandler =
    (mail: MailToolDeps): ToolHandler<SetAutoReplyParams, SetAutoReplyResult> =>
    async (params) => {
        // No gate on the read — reading is harmless — but the whole auto-reply section is paid-only.
        if (!mail.getUser().hasPaidMail) {
            throw new ToolInputError(
                'Nothing was changed: automatic replies are a paid Mail feature, and the account was not on a paid Mail plan when this call ran. Do not retry unless the user says their plan has changed.'
            );
        }

        const resolved = resolveAutoReply(params, Date.now());
        const stored = mail.getMailSettings().AutoResponder;

        if (!resolved.enabled) {
            if (!stored?.IsEnabled) {
                throw new ToolInputError(
                    'Nothing was changed: auto-reply was already off when this call ran. That was its state only then.'
                );
            }
            // Keep the stored message and window, so a later re-enable does not lose the text.
            await mail.setAutoResponder({ ...stored, IsEnabled: false });
            return { enabled: false };
        }

        const preservedZone = stored?.Zone || getMatchingTimezone(getTimezone(), getTimeZoneOptions()).value;
        const autoResponder: AutoResponder = {
            Repeat: AutoReplyDuration.FIXED,
            DaysSelected: [],
            Zone: preservedZone,
            Subject: resolved.subject,
            Message: replaceLineBreaks(htmlEntities(resolved.message)),
            IsEnabled: true,
            StartTime: getUnixTime(new Date(resolved.startMs)),
            EndTime: getUnixTime(new Date(resolved.endMs)),
        };
        if (stored?.IsEnabled && isSameResponder(stored, autoResponder)) {
            throw new ToolInputError(
                'Nothing was changed: auto-reply was already on with that exact message and window when this call ran. That was its state only then.'
            );
        }

        await mail.setAutoResponder(autoResponder);
        return { enabled: true, startMs: resolved.startMs, endMs: resolved.endMs };
    };

const isTurningOff = (params: Record<string, any>): boolean => params.enabled === false;

const asEnablingCall = (params: Record<string, any>): SetAutoReplyParams => ({
    enabled: true,
    message: params[AutoReplyField.MESSAGE] ?? null,
    subject: params[AutoReplyField.SUBJECT] ?? null,
    start: params[AutoReplyField.START] ?? null,
    end: params[AutoReplyField.END] ?? null,
});

const AutoReplyBody = ({ params, onChange }: CardBodyProps) => {
    // Frozen at mount, so the fallbacks handed to DateTimeBody are stable and the end default is provably
    // one week after the start the card is showing.
    const [defaults] = useState(() => defaultWindowMs(params[AutoReplyField.START] ?? null, Date.now()));

    const spec = (param: AutoReplyField, dateLabel: string, timeLabel: string, ms: number): DateTimeFieldSpec => ({
        param,
        dateLabel,
        timeLabel,
        fallback: () => new Date(ms),
    });

    return (
        <>
            <TextFieldBody
                label={c('Label').t`Away message`}
                value={String(params[AutoReplyField.MESSAGE] ?? '')}
                onChange={(value) => onChange({ ...params, [AutoReplyField.MESSAGE]: value })}
                rows={MESSAGE_FIELD_ROWS}
            />
            <DateTimeBody
                params={params}
                onChange={onChange}
                fields={[
                    spec(AutoReplyField.START, c('Label').t`From date`, c('Label').t`From time`, defaults.startMs),
                    spec(AutoReplyField.END, c('Label').t`Until date`, c('Label').t`Until time`, defaults.endMs),
                ]}
            />
            <SettingsLinkBody path="/auto-reply" label={c('Link').t`Advanced auto-reply options`} />
        </>
    );
};

export const setAutoReplyCardRenderer: CardRenderer = {
    icon: IcClockPaperPlane,
    sentence: (action) =>
        isTurningOff(action) ? c('Info').t`Turn off your away message` : c('Info').t`Turn on your away message`,
    renderBody: (props) => (isTurningOff(props.params) ? null : <AutoReplyBody {...props} />),
    // The range rules live here rather than in DateTimeBody, and they are the handler's own: letting the
    // user confirm a window the handler then rejects would surface as a failure they cannot act on.
    canApply: (params) => {
        if (isTurningOff(params)) {
            return true;
        }
        try {
            resolveAutoReply(asEnablingCall(params), Date.now());
            return true;
        } catch {
            return false;
        }
    },
};

export const readAutoReplyModule: MailToolModule = {
    definition: readAutoReplyDefinition,
    createHandler: createReadAutoReplyHandler,
};

export const setAutoReplyModule: MailToolModule = {
    definition: setAutoReplyDefinition,
    createHandler: createSetAutoReplyHandler,
    cardRenderer: setAutoReplyCardRenderer,
};
