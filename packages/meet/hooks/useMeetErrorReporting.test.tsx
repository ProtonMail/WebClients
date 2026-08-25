import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { AnalyticsProvider } from '../contexts/AnalyticsContext';
import { useMeetErrorReporting } from './useMeetErrorReporting';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => true,
}));

const captureMessageMock = vi.mocked(captureMessage);

const wrapper = ({ children }: { children: ReactNode }) => (
    <AnalyticsProvider attributes={{ meetingLinkName: 'meeting-123' }}>
        <AnalyticsProvider attributes={{ isWaitingRoom: true }}>{children}</AnalyticsProvider>
    </AnalyticsProvider>
);

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
            tags: { meetingLinkName: 'meeting-123', isWaitingRoom: true },
        });
    });

    it('keeps the error payload when the report has no options', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        const error = new Error('boom');

        result.current.reportMeetError('Something failed', error);

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error },
            tags: { meetingLinkName: 'meeting-123', isWaitingRoom: true },
        });
    });

    it('lets the call site win over an inherited attribute', () => {
        const { result } = renderHook(() => useMeetErrorReporting(), { wrapper });

        result.current.reportMeetError('Something failed', { tags: { meetingLinkName: 'other-meeting' } });

        expect(captureMessageMock).toHaveBeenCalledWith(
            'Something failed',
            expect.objectContaining({ tags: { meetingLinkName: 'other-meeting', isWaitingRoom: true } })
        );
    });

    it('reports without attributes when there is no provider above', () => {
        const { result } = renderHook(() => useMeetErrorReporting());

        result.current.reportMeetError('Something failed');

        expect(captureMessageMock).toHaveBeenCalledWith('Something failed', {
            level: 'error',
            extra: { error: undefined },
            tags: {},
        });
    });
});
