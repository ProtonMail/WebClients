import { useRoomContext } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';

import { useE2EE } from './useE2EE';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

describe('useE2EE', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should enable E2EE', () => {
        const mockRoom = {
            setE2EEEnabled: vi.fn(),
        };

        // @ts-expect-error
        vi.mocked(useRoomContext).mockReturnValue(mockRoom);

        renderHook(() => useE2EE());

        expect(mockRoom.setE2EEEnabled).toHaveBeenCalledWith(true);
    });
});
