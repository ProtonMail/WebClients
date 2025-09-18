import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/components';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import { srpGetVerify } from '@proton/shared/lib/srp';

import { encryptMeetingPassword, encryptSessionKey, hashPasswordWithSalt } from '../utils/cryptoUtils';
import { useUpdateMeetingPassword } from './useUpdateMeetingPassword';

vi.mock('@proton/shared/lib/srp', () => ({
    srpGetVerify: vi.fn(),
}));

vi.mock('@proton/components', () => ({
    useApi: vi.fn(),
}));

// As the return values of these functions are non-deterministic, it's more feasible to mock them
vi.mock('../utils/cryptoUtils', () => ({
    encryptMeetingPassword: vi.fn(),
    encryptSessionKey: vi.fn(),
    hashPasswordWithSalt: vi.fn(),
}));

vi.mock('@proton/account/addresses/hooks', () => ({
    useGetAddresses: vi.fn(),
}));

vi.mock('@proton/account/userKeys/hooks', () => ({
    useGetUserKeys: vi.fn(),
}));

describe('useUpdateMeetingPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should allow for updating a meeting password', async () => {
        const meetingId = '12345678';
        const password = 'test password';
        const sessionKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

        const privateKey = 'private key';

        const mockMeeting = { MeetingPassword: 'mock password' };

        const mockApi = vi.fn().mockResolvedValue({ Meeting: mockMeeting });

        (useApi as Mock).mockReturnValue(mockApi);

        (useGetUserKeys as Mock).mockReturnValue(() => [{ privateKey }]);

        (useGetAddresses as Mock).mockReturnValue(
            vi.fn().mockResolvedValue([{ ID: 'test-address-id', Status: ADDRESS_STATUS.STATUS_ENABLED }])
        );

        const encryptedPassword = 'encrypted password';
        const encryptedSessionKey = 'encrypted session key';
        const salt = 'salt';
        const srpSalt = 'srp salt';
        const srpVerifier = 'srp verifier';
        const srpModulusID = 'srp modulus id';

        (encryptMeetingPassword as Mock).mockResolvedValue(encryptedPassword);
        (encryptSessionKey as Mock).mockResolvedValue(encryptedSessionKey);
        (hashPasswordWithSalt as Mock).mockResolvedValue({ salt, passwordHash: 'password hash' });
        (srpGetVerify as Mock).mockResolvedValue({
            Auth: {
                Salt: srpSalt,
                Verifier: srpVerifier,
                ModulusID: srpModulusID,
            },
        });

        const { result } = renderHook(() => useUpdateMeetingPassword());

        const meeting = await result.current.updateMeetingPassword({
            meetingId,
            password,
            sessionKey: { data: sessionKey, algorithm: 'aes256' },
            customPassword: CustomPasswordState.NO_PASSWORD,
        });

        expect(srpGetVerify).toHaveBeenCalledWith({
            api: mockApi,
            credentials: { password },
        });

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'put',
                url: `meet/v1/meetings/${meetingId}/password`,
                data: expect.objectContaining({
                    Password: encryptedPassword,
                    SessionKey: encryptedSessionKey,
                    SRPSalt: srpSalt,
                    SRPVerifier: srpVerifier,
                    SRPModulusID: srpModulusID,
                    CustomPassword: CustomPasswordState.NO_PASSWORD,
                }),
            })
        );

        expect(meeting).toEqual(mockMeeting);
    });
});
