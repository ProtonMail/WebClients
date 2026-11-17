import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestAccessToken } from './meetSrpRequests';

describe('requestAccessToken', () => {
    const api = vi.fn();

    beforeEach(() => {
        api.mockReset();
        api.mockResolvedValue({});
    });

    it('asks the API layer not to notify the given error codes', async () => {
        await requestAccessToken(api, {
            meetingLinkName: 'meeting-abc',
            encryptedDisplayName: 'encrypted-name',
            silence: [2502],
        });

        expect(api).toHaveBeenCalledWith(expect.objectContaining({ silence: [2502] }));
    });

    it('leaves every error to the API layer notification when no codes are given', async () => {
        await requestAccessToken(api, { meetingLinkName: 'meeting-abc', encryptedDisplayName: 'encrypted-name' });

        expect(api.mock.calls[0][0]).not.toHaveProperty('silence');
    });
});
