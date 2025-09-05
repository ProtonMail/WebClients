import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/components';

import { encryptMeetingName } from '../utils/cryptoUtils';
import { useUpdateMeetingName } from './useUpdateMeetingName';

vi.mock('@proton/components', () => ({
    useApi: vi.fn(),
}));

vi.mock('../utils/cryptoUtils', () => ({
    encryptMeetingName: vi.fn(),
}));

describe('useUpdateMeetingName', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should allow for updating a meeting name', async () => {
        const meetingName = 'test meeting';
        const encryptedMeetingName = 'encrypted meeting name';
        const meetingId = '12345678';
        const sessionKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

        const mockMeeting = { MeetingName: meetingName };

        const mockResponse = { Meeting: mockMeeting };

        const mockApi = vi.fn().mockResolvedValue(mockResponse);

        (useApi as Mock).mockReturnValue(mockApi);

        (encryptMeetingName as Mock).mockResolvedValue(encryptedMeetingName);

        const { result } = renderHook(() => useUpdateMeetingName());

        const meeting = await result.current.updateMeetingName(meetingId, meetingName, sessionKey);

        expect(encryptMeetingName).toHaveBeenCalledWith(meetingName, sessionKey);

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'put',
                url: `meet/v1/meetings/${meetingId}/name`,
                data: expect.objectContaining({
                    Name: encryptedMeetingName,
                }),
            })
        );

        expect(meeting).toEqual(mockMeeting);
    });
});
