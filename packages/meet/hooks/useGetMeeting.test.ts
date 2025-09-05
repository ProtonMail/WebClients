import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/components';

import { useGetMeeting } from './useGetMeeting';

vi.mock('@proton/components', () => ({
    useApi: vi.fn(),
}));

describe('useGetMeeting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should allow for getting a meeting', async () => {
        const meetingId = '12345678';

        const mockMeeting = {
            id: meetingId,
            name: 'Test Meeting',
        };

        const mockApi = vi.fn().mockResolvedValue({
            Meeting: mockMeeting,
        });

        (useApi as Mock).mockReturnValue(mockApi);

        const { result } = renderHook(() => useGetMeeting());

        const meeting = await result.current.getMeeting(meetingId);

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'get',
                url: `meet/v1/meetings/${meetingId}`,
            })
        );

        expect(meeting).toEqual(mockMeeting);
    });
});
