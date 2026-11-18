import { renderHook } from '@testing-library/react';

import { useMeetingAuthentication } from './useMeetingAuthentication';

const mocks = vi.hoisted(() => ({ api: vi.fn() }));

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mocks.api }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));

describe('useMeetingAuthentication getAccessDetails', () => {
    beforeEach(() => {
        mocks.api.mockReset();
        mocks.api.mockResolvedValue({ AccessToken: 'tok', WebsocketUrl: 'wss://x/rtc' });
    });

    it('asks the API layer not to notify the given error codes', async () => {
        const { result } = renderHook(() => useMeetingAuthentication());

        await result.current.getAccessDetails({
            meetingLinkName: 'meeting-abc',
            encryptedDisplayName: 'encrypted-name',
            silence: [2502],
        });

        expect(mocks.api).toHaveBeenCalledWith(expect.objectContaining({ silence: [2502] }));
    });
});
