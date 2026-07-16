import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { useMeetingErrorContext } from './useMeetingErrorContext';

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: vi.fn(),
}));

const useMeetErrorReportingMock = useMeetErrorReporting as unknown as Mock;

const mockReportMeetError = vi.fn();
const mockClearSentryReportErrorCounts = vi.fn();

describe('useMeetingErrorContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useMeetErrorReportingMock.mockReturnValue({
            reportMeetError: mockReportMeetError,
            clearSentryReportErrorCounts: mockClearSentryReportErrorCounts,
        });
    });

    describe('withMeetingLinkNameTag', () => {
        it('returns the options untouched when no meeting link name is set', () => {
            const { result } = renderHook(() => useMeetingErrorContext());

            const options = { tags: { foo: 'bar' } };

            expect(result.current.withMeetingLinkNameTag(options)).toBe(options);
            expect(result.current.withMeetingLinkNameTag('err')).toBe('err');
            expect(result.current.withMeetingLinkNameTag(undefined)).toBeUndefined();
        });

        it('wraps a string option as context.error alongside the tag', () => {
            const { result } = renderHook(() => useMeetingErrorContext());
            result.current.meetingLinkNameRef.current = 'meeting-123';

            expect(result.current.withMeetingLinkNameTag('some error')).toEqual({
                context: { error: 'some error' },
                tags: { meetingLinkName: 'meeting-123' },
            });
        });

        it('merges the tag into an object option, preserving existing tags', () => {
            const { result } = renderHook(() => useMeetingErrorContext());
            result.current.meetingLinkNameRef.current = 'meeting-123';

            expect(result.current.withMeetingLinkNameTag({ level: 'warning', tags: { existing: 'x' } })).toEqual({
                level: 'warning',
                tags: { existing: 'x', meetingLinkName: 'meeting-123' },
            });
        });

        it('returns only the tag when the option is neither a string nor an object', () => {
            const { result } = renderHook(() => useMeetingErrorContext());
            result.current.meetingLinkNameRef.current = 'meeting-123';

            expect(result.current.withMeetingLinkNameTag(42)).toEqual({
                tags: { meetingLinkName: 'meeting-123' },
            });
            expect(result.current.withMeetingLinkNameTag(undefined)).toEqual({
                tags: { meetingLinkName: 'meeting-123' },
            });
        });
    });
});
