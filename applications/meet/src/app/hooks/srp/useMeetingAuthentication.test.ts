import { renderHook } from '@testing-library/react';

import { isAccessTokenError } from '../../utils/accessTokenError';
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

    it('marks its failures as coming from the access token', async () => {
        const error = Object.assign(new Error('api error'), { status: 422, data: { Code: 2011, Error: 'error' } });
        mocks.api.mockRejectedValue(error);
        const { result } = renderHook(() => useMeetingAuthentication());

        await expect(
            result.current.getAccessDetails({ meetingLinkName: 'meeting-abc', encryptedDisplayName: 'encrypted-name' })
        ).rejects.toBe(error);

        expect(isAccessTokenError(error)).toBe(true);
    });
});
