import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { AutoReplyDuration } from '@proton/shared/lib/constants';
import type { AutoResponder } from '@proton/shared/lib/interfaces';

import { formatLocalDateTime } from '../../helpers/formatting';
import type { MailToolDeps } from '../../toolModule';
import type { ReadAutoReplyResult, SetAutoReplyParams } from './autoReply';
import {
    defaultWindowMs,
    readAutoReplyDefinition,
    readAutoReplyModule,
    resolveAutoReply,
    setAutoReplyCardRenderer,
    setAutoReplyDefinition,
    setAutoReplyModule,
} from './autoReply';

const NOW_MS = Date.parse('2026-07-09T08:00:00Z');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const START = '2026-07-09T09:00:00Z';
const END = '2026-07-13T09:00:00Z';
const START_SECONDS = Date.parse(START) / 1000;
const END_SECONDS = Date.parse(END) / 1000;

const enable = (overrides: Partial<SetAutoReplyParams> = {}): SetAutoReplyParams => ({
    enabled: true,
    message: 'On leave.',
    subject: null,
    start: START,
    end: END,
    ...overrides,
});

const DISABLE: SetAutoReplyParams = { enabled: false, message: null, subject: null, start: null, end: null };

/** The responder the enabling params above resolve to, as it is stored: HTML message, epoch SECONDS. */
const STORED_ON: AutoResponder = {
    Repeat: AutoReplyDuration.FIXED,
    DaysSelected: [],
    Zone: 'Europe/Zurich',
    Subject: 'Auto',
    Message: 'On leave.',
    IsEnabled: true,
    StartTime: START_SECONDS,
    EndTime: END_SECONDS,
};

const setUp = ({ hasPaidMail = true, stored }: { hasPaidMail?: boolean; stored?: AutoResponder } = {}) => {
    const setAutoResponder = jest.fn().mockResolvedValue(undefined);
    const deps = {
        getUser: () => ({ hasPaidMail }),
        getMailSettings: () => ({ AutoResponder: stored }),
        setAutoResponder,
    } as unknown as MailToolDeps;

    return {
        setAutoResponder,
        set: (params: SetAutoReplyParams) => setAutoReplyModule.createHandler(deps)(params, {} as any),
        read: (): Promise<ReadAutoReplyResult> => readAutoReplyModule.createHandler(deps)({}, {} as any),
    };
};

describe('resolveAutoReply', () => {
    it('short-circuits a disable, so neither a message nor a window is needed to turn it off', () => {
        expect(resolveAutoReply(DISABLE, NOW_MS)).toEqual({ enabled: false });
    });

    it('trims the message and falls back to the untranslated default subject', () => {
        expect(resolveAutoReply(enable({ message: '  On leave.  ', subject: '  ' }), NOW_MS)).toEqual({
            enabled: true,
            message: 'On leave.',
            subject: 'Auto',
            startMs: Date.parse(START),
            endMs: Date.parse(END),
        });
    });

    it('rejects enabling with a message of only whitespace', () => {
        expect(() => resolveAutoReply(enable({ message: '   ' }), NOW_MS)).toThrow(ToolInputError);
    });

    // The named field is what tells the model WHICH datetime to re-send, so here the wording IS the
    // behaviour — and it is all that separates these two cases.
    it.each([
        ['start', { start: 'next Monday' }],
        ['end', { end: 'in a fortnight' }],
    ])('names the %s field when its datetime cannot be read', (field, overrides) => {
        expect(() => resolveAutoReply(enable(overrides), NOW_MS)).toThrow(
            expect.objectContaining({ message: expect.stringContaining(`\`${field}\``) })
        );
    });

    it('defaults a missing start to now and a missing end to one week after it', () => {
        expect(resolveAutoReply(enable({ start: null, end: null }), NOW_MS)).toMatchObject({
            startMs: NOW_MS,
            endMs: NOW_MS + WEEK_MS,
        });
    });

    it('defaults a missing end to one week after the start the model DID send', () => {
        expect(resolveAutoReply(enable({ end: null }), NOW_MS)).toMatchObject({
            startMs: Date.parse(START),
            endMs: Date.parse(START) + WEEK_MS,
        });
    });

    it.each([
        ['an end before the start', { start: END, end: START }],
        ['an end equal to the start', { start: START, end: START }],
    ])('rejects %s', (_case, overrides) => {
        expect(() => resolveAutoReply(enable(overrides), NOW_MS)).toThrow(ToolInputError);
    });

    // Ends after it starts, so only the future-end rule can reject it: the server would never fire it.
    it('rejects a window that has already ended', () => {
        expect(() =>
            resolveAutoReply(enable({ start: '2026-07-01T09:00:00Z', end: '2026-07-08T09:00:00Z' }), NOW_MS)
        ).toThrow(ToolInputError);
    });

    // The start may legitimately be in the past ("I've been away since Monday") — only the END must not be.
    it('accepts a window that started in the past but has not ended', () => {
        expect(resolveAutoReply(enable({ start: '2026-07-01T09:00:00Z' }), NOW_MS)).toMatchObject({ enabled: true });
    });
});

describe('defaultWindowMs', () => {
    it('offers one week from the start the model sent', () => {
        expect(defaultWindowMs(START, NOW_MS)).toEqual({
            startMs: Date.parse(START),
            endMs: Date.parse(START) + WEEK_MS,
        });
    });

    it('offers one week from now when the model sent no start it can read', () => {
        expect(defaultWindowMs('next Monday', NOW_MS)).toEqual({ startMs: NOW_MS, endMs: NOW_MS + WEEK_MS });
    });
});

describe('read_auto_reply', () => {
    it('reports epoch milliseconds for a window the store keeps in seconds', async () => {
        const { read } = setUp({ stored: STORED_ON });

        await expect(read()).resolves.toMatchObject({
            startMs: Date.parse(START),
            endMs: Date.parse(END),
        });
    });

    it('reads the stored HTML message back as plain text', async () => {
        const { read } = setUp({ stored: { ...STORED_ON, Message: 'On leave.<br>Back Monday.' } });

        await expect(read()).resolves.toMatchObject({ message: 'On leave.\nBack Monday.' });
    });

    // This is what lets the model say what is already stored before re-enabling it.
    it('still reports the stored message and window when the responder is off', async () => {
        const { read } = setUp({ stored: { ...STORED_ON, IsEnabled: false } });

        await expect(read()).resolves.toEqual({
            enabled: false,
            repeat: AutoReplyDuration.FIXED,
            message: 'On leave.',
            subject: 'Auto',
            startMs: Date.parse(START),
            endMs: Date.parse(END),
        });
    });

    it('reports nothing stored when no responder was ever configured', async () => {
        const { read } = setUp();

        await expect(read()).resolves.toEqual({
            enabled: false,
            repeat: null,
            message: null,
            subject: null,
            startMs: null,
            endMs: null,
        });
    });

    // 0 is how the store spells "unset", and fromUnixTime(0) would report 1970 as a real window.
    it('reports an unset time as absent rather than as the epoch', async () => {
        const { read } = setUp({ stored: { ...STORED_ON, StartTime: 0, EndTime: 0 } });

        await expect(read()).resolves.toMatchObject({ startMs: null, endMs: null });
    });

    // A recurring responder keeps seconds-of-day in those fields, which would be read back as 1970 dates.
    it.each([
        ['daily', AutoReplyDuration.DAILY],
        ['weekly', AutoReplyDuration.WEEKLY],
        ['monthly', AutoReplyDuration.MONTHLY],
        ['permanent', AutoReplyDuration.PERMANENT],
    ])('reports no window for a %s responder, and the schedule it repeats on', async (_case, repeat) => {
        const { read } = setUp({ stored: { ...STORED_ON, Repeat: repeat, StartTime: 9 * 3600, EndTime: 17 * 3600 } });

        await expect(read()).resolves.toMatchObject({ repeat, startMs: null, endMs: null });
    });
});

describe('set_auto_reply', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('refuses a free user before touching the store', async () => {
        const { set, setAutoResponder } = setUp({ hasPaidMail: false });

        await expect(set(enable())).rejects.toThrow(ToolInputError);
        expect(setAutoResponder).not.toHaveBeenCalled();
    });

    it('writes the window as epoch seconds, and the message as HTML', async () => {
        const { set, setAutoResponder } = setUp();

        await expect(set(enable({ message: 'On leave.\nBack Monday. <not a tag>' }))).resolves.toEqual({
            enabled: true,
            startMs: Date.parse(START),
            endMs: Date.parse(END),
        });
        expect(setAutoResponder).toHaveBeenCalledWith({
            Repeat: AutoReplyDuration.FIXED,
            DaysSelected: [],
            Zone: expect.any(String),
            Subject: 'Auto',
            Message: 'On leave.<br />Back Monday. &lt;not a tag&gt;',
            IsEnabled: true,
            StartTime: START_SECONDS,
            EndTime: END_SECONDS,
        });
    });

    it('refuses to turn off a responder that is already off, rather than writing a disabled one', async () => {
        const { set, setAutoResponder } = setUp({ stored: { ...STORED_ON, IsEnabled: false } });

        await expect(set(DISABLE)).rejects.toThrow(ToolInputError);
        expect(setAutoResponder).not.toHaveBeenCalled();
    });

    it('refuses to turn off when nothing has ever been configured', async () => {
        const { set, setAutoResponder } = setUp();

        await expect(set(DISABLE)).rejects.toThrow(ToolInputError);
        expect(setAutoResponder).not.toHaveBeenCalled();
    });

    // Writing a blank disabled responder would lose the text a later re-enable needs.
    it('keeps the stored message and window when turning off', async () => {
        const { set, setAutoResponder } = setUp({ stored: STORED_ON });

        await expect(set(DISABLE)).resolves.toEqual({ enabled: false });
        expect(setAutoResponder).toHaveBeenCalledWith({ ...STORED_ON, IsEnabled: false });
    });

    it('refuses to re-apply an identical message, subject and window', async () => {
        const { set, setAutoResponder } = setUp({ stored: STORED_ON });

        await expect(set(enable())).rejects.toThrow(ToolInputError);
        expect(setAutoResponder).not.toHaveBeenCalled();
    });

    // The guard above must not swallow a real edit — that would be a silent refusal of a legitimate change.
    it.each([
        ['a different message', { message: 'Back on Tuesday.' }],
        ['a different subject', { subject: 'Out of office' }],
        ['a different start', { start: '2026-07-10T09:00:00Z' }],
        ['a different end', { end: '2026-07-14T09:00:00Z' }],
    ])('applies %s over an already-enabled responder', async (_case, overrides) => {
        const { set, setAutoResponder } = setUp({ stored: STORED_ON });

        await expect(set(enable(overrides))).resolves.toMatchObject({ enabled: true });
        expect(setAutoResponder).toHaveBeenCalledTimes(1);
    });

    // Their timezone is a setting they chose; the browser's is only a fallback, and is wrong while travelling.
    it('keeps the stored timezone rather than overwriting it with the browser one', async () => {
        const { set, setAutoResponder } = setUp({ stored: { ...STORED_ON, Zone: 'Pacific/Auckland' } });

        await set(enable({ message: 'Back on Tuesday.' }));

        expect(setAutoResponder).toHaveBeenCalledWith(expect.objectContaining({ Zone: 'Pacific/Auckland' }));
    });

    // Only an ENABLED responder can be an unchanged one; a stored-but-off match is a real re-enable.
    it('re-enables a stored responder whose message and window are unchanged', async () => {
        const { set, setAutoResponder } = setUp({ stored: { ...STORED_ON, IsEnabled: false } });

        await expect(set(enable())).resolves.toMatchObject({ enabled: true });
        expect(setAutoResponder).toHaveBeenCalledWith(expect.objectContaining({ IsEnabled: true }));
    });
});

describe('setAutoReplyCardRenderer', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each([
        ['turning it off, which edits nothing', { enabled: false }, true],
        ['a valid message and window', { enabled: true, message: 'On leave.', start: START, end: END }, true],
        ['an emptied message', { enabled: true, message: '  ', start: START, end: END }, false],
        ['an end before the start', { enabled: true, message: 'On leave.', start: END, end: START }, false],
        [
            'a window already in the past',
            { enabled: true, message: 'On leave.', start: '2026-07-01T09:00:00Z', end: '2026-07-08T09:00:00Z' },
            false,
        ],
    ])('allows Confirm only on a window the handler would accept: %s', (_case, params, applyable) => {
        expect(setAutoReplyCardRenderer.canApply?.(params)).toBe(applyable);
    });

    it('renders no editable body when the action only turns auto-reply off', () => {
        const params = { enabled: false };

        expect(
            setAutoReplyCardRenderer.renderBody?.({
                params,
                action: { type: 'set_auto_reply', ...params },
                labels: {},
                onChange: jest.fn(),
            })
        ).toBeNull();
    });
});

describe('definitions', () => {
    it('leaves only the boolean guarded, so a subject like "out-office" is not read as a reference', () => {
        const guarded = Object.keys(setAutoReplyDefinition.paramsSchema.properties).filter(
            (param) => !setAutoReplyDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual(['enabled']);
    });

    // The model cannot report what is already set if the payload leaves the stored message out of it.
    it('carries the stored message and window into the payload the model reads', () => {
        const serialized = readAutoReplyDefinition.serializeForLumo(
            {
                enabled: true,
                repeat: AutoReplyDuration.FIXED,
                message: 'On leave.',
                subject: 'Auto',
                startMs: Date.parse(START),
                endMs: Date.parse(END),
            },
            {} as any
        );

        expect(serialized).toContain('On leave.');
        expect(serialized).toContain(formatLocalDateTime(new Date(START)));
    });
});
