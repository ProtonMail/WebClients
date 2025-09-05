import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/components';

import { useDeleteMeeting } from './useDeleteMeeting';

vi.mock('@proton/components', () => ({
    useApi: vi.fn(),
}));

describe('useDeleteMeeting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should allow for deleting a meeting', async () => {
        const meetingId = '12345678';

        const mockApi = vi.fn();

        (useApi as Mock).mockReturnValue(mockApi);

        const { result } = renderHook(() => useDeleteMeeting());

        await result.current.deleteMeeting(meetingId);

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'delete',
                url: `meet/v1/meetings/${meetingId}`,
            })
        );
    });
});
