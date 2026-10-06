import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';

import { logger } from '@proton/logger';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';

import { AnalyticsProvider } from '../contexts/AnalyticsContext';
import { setMeetCoreErrorResolver, useMeetErrorReporting } from './useMeetErrorReporting';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
    traceError: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const captureMessageMock = vi.mocked(captureMessage);
const traceErrorMock = vi.mocked(traceError);
const useFlagMock = vi.mocked(useFlag);
const loggerMock = vi.mocked(logger);

const wrapper = ({ children }: { children: ReactNode }) => (
    <AnalyticsProvider attributes={{ meetingLinkName: 'meeting-123' }}>
        <AnalyticsProvider attributes={{ isWaitingRoom: true }}>{children}</AnalyticsProvider>
    </AnalyticsProvider>
);

const expectedTags = { meetingLinkName: 'meeting-123', isWaitingRoom: true, label: 'Something failed' };

describe('useMeetErrorReporting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFlagMock.mockImplementation(() => true);
    });

    it('writes the report to the logger at the matching level, with the error apart from the rest of the context', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const error = new Error('boom');

        result.current.reportMeetError('Something failed', { context: { error, epoch: 4 }, level: 'warning' });

        expect(loggerMock.warn).toHaveBeenCalledWith('Something failed', error, { epoch: 4 });
    });

    it('writes to the logger even when Sentry reporting is off', () => {
        useFlagMock.mockImplementation((flag) => flag !== 'MeetErrorReporting');
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', 29);

        expect(loggerMock.error).toHaveBeenCalledWith('Something failed', 29);
        expect(captureMessageMock).not.toHaveBeenCalled();
    });

    it('keeps writing to the logger after Sentry stops reporting the same label', () => {
        useFlagMock.mockImplementation((flag) => flag !== 'MeetRemoveSentryEventLimit');
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        for (let i = 0; i < 11; i++) {
            result.current.reportMeetError('Something failed', 29);
        }

        expect(captureMessageMock).toHaveBeenCalledTimes(10);
        expect(loggerMock.error).toHaveBeenCalledTimes(11);
    });

    it('tags the report with the attributes of every provider above it', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', { context: { error: 'boom' } });

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error: 'boom' },
            fingerprint: undefined,
            tags: expectedTags,
        });
        expect(traceErrorMock).not.toHaveBeenCalled();
    });

    it('lets the call site win over an inherited attribute', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', { tags: { meetingLinkName: 'other-meeting' } });

        expect(captureMessageMock).toHaveBeenCalledWith(
            'Something failed',
            expect.objectContaining({ tags: { ...expectedTags, meetingLinkName: 'other-meeting' } })
        );
    });

    it('keeps the label tag over a tag with the same name', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', { tags: { label: 'other' } });

        expect(captureMessageMock).toHaveBeenCalledWith(
            'Something failed',
            expect.objectContaining({ tags: expect.objectContaining({ label: 'Something failed' }) })
        );
    });

    it('reports with the label alone when there is no provider above', () => {
        const { result } = renderHook(() => useMeetErrorReporting());

        result.current.reportMeetError('Something failed');

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error: undefined },
            fingerprint: undefined,
            tags: { label: 'Something failed' },
        });
    });

    it('sends an Error as an exception, grouped by the label', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const error = new Error('boom');

        result.current.reportMeetError('Something failed', error);

        expect(traceErrorMock).toHaveBeenCalledWith(error, {
            level: 'error',
            extra: { error },
            tags: expectedTags,
            fingerprint: ['Something failed'],
        });
        expect(captureMessageMock).not.toHaveBeenCalled();
    });

    it('sends an Error passed as context.error as an exception, keeping the rest of the context', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const error = new Error('boom');

        result.current.reportMeetError('Something failed', { context: { error, epoch: 4 }, level: 'warning' });

        expect(traceErrorMock).toHaveBeenCalledWith(error, {
            level: 'warning',
            extra: { error, epoch: 4 },
            tags: expectedTags,
            fingerprint: ['Something failed'],
        });
    });

    it('keeps an explicit fingerprint over the label', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const error = new Error('boom');

        result.current.reportMeetError('Something failed', { context: { error }, fingerprint: ['custom'] });

        expect(traceErrorMock).toHaveBeenCalledWith(error, expect.objectContaining({ fingerprint: ['custom'] }));
    });

    it('keeps an ApiError as a message, since the shared beforeSend drops api exceptions', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const apiError = new ApiError('Unprocessable Entity', 422, 'ApiError');

        result.current.reportMeetError('Something failed', apiError);

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error: apiError },
            fingerprint: undefined,
            tags: expectedTags,
        });
        expect(traceErrorMock).not.toHaveBeenCalled();
    });

    it('keeps a bare meet core error enum as a message', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', 29);

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error: 29 },
            fingerprint: undefined,
            tags: expectedTags,
        });
        expect(traceErrorMock).not.toHaveBeenCalled();
    });

    describe('with a meet core error resolver registered', () => {
        const resolvedError = new Error('boom');

        beforeEach(() => {
            setMeetCoreErrorResolver((error) =>
                error === 29 || error === resolvedError ? 'HttpClientError' : undefined
            );
        });

        afterEach(() => {
            setMeetCoreErrorResolver(() => undefined);
        });

        it('names the core error in the message and in its own tag', () => {
            const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

            result.current.reportMeetError('Something failed', 29);

            expect(captureMessageMock).toHaveBeenCalledWith('Something failed: HttpClientError', {
                level: 'error',
                extra: { error: 29 },
                fingerprint: undefined,
                tags: { ...expectedTags, meetCoreError: 'HttpClientError' },
            });
        });

        it('groups an exception by the named label and keeps the label tag unnamed', () => {
            const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

            result.current.reportMeetError('Something failed', resolvedError);

            expect(traceErrorMock).toHaveBeenCalledWith(resolvedError, {
                level: 'error',
                extra: { error: resolvedError },
                tags: { ...expectedTags, meetCoreError: 'HttpClientError' },
                fingerprint: ['Something failed: HttpClientError'],
            });
        });

        it('leaves a report the resolver does not recognise untouched', () => {
            const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

            result.current.reportMeetError('Something failed', { context: { error: 'boom' } });

            expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
                level: 'error',
                extra: { error: 'boom' },
                fingerprint: undefined,
                tags: expectedTags,
            });
        });
    });
});
