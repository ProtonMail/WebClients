import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';

import { AnalyticsProvider } from '../contexts/AnalyticsContext';
import { useMeetErrorReporting } from './useMeetErrorReporting';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
    traceError: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => true,
}));

const captureMessageMock = vi.mocked(captureMessage);
const traceErrorMock = vi.mocked(traceError);

const wrapper = ({ children }: { children: ReactNode }) => (
    <AnalyticsProvider attributes={{ meetingLinkName: 'meeting-123' }}>
        <AnalyticsProvider attributes={{ isWaitingRoom: true }}>{children}</AnalyticsProvider>
    </AnalyticsProvider>
);

const expectedTags = { meetingLinkName: 'meeting-123', isWaitingRoom: true, label: 'Something failed' };

describe('useMeetErrorReporting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});
