import { act, renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { LumoChainEnd, LumoConfirmAnswer } from '@proton/llm/lib/lumoAgent/ui/types';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { buildUser } from '@proton/shared/testing/buildUser';

import { LumoModelChoice } from '../useLumoModelChoice';
import { useLumoMailTelemetry } from './useLumoMailTelemetry';

const api = jest.fn();

jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => api,
}));

jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    __esModule: true,
    sendTelemetryReport: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});

const sent = sendTelemetryReport as jest.Mock;
const user = buildUser();

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.mocked(useUser).mockReturnValue([user, false]);
});

/**
 * These pin the wire contract against `definitions/mail/lumo.yaml` in the telemetry repo: the strings
 * here are the strings the aggregation reads, and they are declared in a different repository, so
 * renaming one on this side without the other is exactly the silent break worth failing on.
 */
const lastReport = () => sent.mock.calls[sent.mock.calls.length - 1][0];

const expectReport = (
    event: string,
    dimensions?: Record<string, string | undefined>,
    values?: Record<string, number>
) =>
    expect(lastReport()).toEqual({
        api,
        measurementGroup: 'mail.web.lumo',
        event,
        dimensions,
        values,
        delay: false,
    });

const renderTelemetry = () => renderHook(() => useLumoMailTelemetry()).result;

describe('useLumoMailTelemetry', () => {
    it('reports the assistant being opened', () => {
        const { current } = renderTelemetry();

        act(() => current.assistantOpened());

        expectReport('assistant_opened', undefined, undefined);
    });

    it('reports a typed prompt with no card behind it', () => {
        const { current } = renderTelemetry();

        act(() => current.promptSent());

        expectReport('prompt_sent', { promptSource: 'typed', suggestionCard: 'n/a', model: 'lumo-max' });
    });

    it('names the model the user chose', () => {
        localStorage.setItem(`lumo-in-mail-model-${user.ID}`, JSON.stringify(LumoModelChoice.LITE));
        const { current } = renderTelemetry();

        act(() => current.promptSent());

        expectReport('prompt_sent', { promptSource: 'typed', suggestionCard: 'n/a', model: 'lumo-lite' });
    });

    it('attributes a prompt to the welcome card that was picked', () => {
        const { current } = renderTelemetry();

        act(() => {
            current.suggestionPicked('auto-reply');
            current.promptSent();
        });

        expectReport('prompt_sent', {
            promptSource: 'suggestion_card',
            suggestionCard: 'auto-reply',
            model: 'lumo-max',
        });
    });

    // A card attributes the one send it produced. Without the reset every later message in the
    // conversation would be credited to it, and the cards would look far better used than they are.
    it('credits the card once, not for the rest of the conversation', () => {
        const { current } = renderTelemetry();

        act(() => {
            current.suggestionPicked('triage');
            current.promptSent();
            current.promptSent();
        });

        expectReport('prompt_sent', { promptSource: 'typed', suggestionCard: 'n/a', model: 'lumo-max' });
    });

    it('reports a chain with the time and the calls it took', () => {
        const { current } = renderTelemetry();

        act(() => current.chainEnded(LumoChainEnd.SUCCEEDED, { durationMs: 2500, toolCalls: 3 }));

        expectReport(
            'chain_end',
            { isResumed: 'false', reason: 'succeeded', model: 'lumo-max' },
            { durationSeconds: 2.5, toolCalls: 3 }
        );
    });

    // Every way a turn can end collapses onto one event, so the reason is the only thing separating them.
    it.each([
        [LumoChainEnd.FAILED, 'failed'],
        [LumoChainEnd.STOPPED, 'user_stopped'],
        [LumoChainEnd.REPLACED, 'replaced'],
        [LumoChainEnd.DISCARDED, 'discarded'],
        [LumoChainEnd.CONTEXT_LIMIT, 'context_limit'],
    ])('reports %s with its own reason', (end, reason) => {
        const { current } = renderTelemetry();

        act(() => current.chainEnded(end, { durationMs: 4000, toolCalls: 10 }));

        expectReport(
            'chain_end',
            { isResumed: 'false', reason, model: 'lumo-max' },
            { durationSeconds: 4, toolCalls: 10 }
        );
    });

    it('reports a tool that ran', () => {
        const { current } = renderTelemetry();

        act(() => current.toolSucceeded('read_email', 'read'));

        expectReport('tool_end', { toolName: 'read_email', toolKind: 'read', reason: 'succeeded', model: 'lumo-max' });
    });

    it('reports a tool that threw', () => {
        const { current } = renderTelemetry();

        act(() => current.toolFailed('move_emails', 'mutation'));

        expectReport('tool_end', {
            toolName: 'move_emails',
            toolKind: 'mutation',
            reason: 'failed',
            model: 'lumo-max',
        });
    });

    it('reports how a confirmation card was answered', () => {
        const { current } = renderTelemetry();

        act(() => current.confirmAnswered('apply_labels', LumoConfirmAnswer.CANCELLED));

        expectReport('confirm_answered', { toolName: 'apply_labels', answer: 'cancelled' });
    });

    it('reports a debug report being drafted', () => {
        const { current } = renderTelemetry();

        act(() => current.debugReportOpened());

        expectReport('debug_report_opened', undefined, undefined);
    });
});
