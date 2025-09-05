import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';

import { useCreateMeeting } from './useCreateMeeting';

vi.mock('@proton/shared/lib/srp', () => ({
    srpGetVerify: vi.fn().mockResolvedValue({
        Auth: {
            Salt: 'this is mock salt',
            Verifier: 'this is mock verifier',
            ModulusID: 'this is mock modulus id',
        },
    }),
}));

vi.mock('@proton/utils/getRandomString', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue('mockpassword'),
}));

vi.mock('@proton/components', () => ({
    useApi: vi.fn(),
}));

vi.mock('@proton/account/addresses/hooks', () => ({
    useGetAddresses: vi.fn(),
}));

vi.mock('@proton/account/userKeys/hooks', () => ({
    useGetUserKeys: vi.fn(),
}));

describe('useCreateMeeting', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should allow for creating a meeting', async () => {
        const meetingLinkName = '12345678';

        const privateKey = await CryptoProxy.generateKey({
            userIDs: [{ name: 'Your Name', email: 'your@email.com' }],
        });

        const mockApi = vi.fn().mockResolvedValue({ Meeting: { MeetingLinkName: meetingLinkName } });

        (useApi as Mock).mockReturnValue(mockApi);

        (useGetUserKeys as Mock).mockReturnValue(() => [{ privateKey }]);

        (useGetAddresses as Mock).mockReturnValue(
            vi.fn().mockResolvedValue([
                {
                    ID: 'test-address-id',
                    Status: ADDRESS_STATUS.STATUS_ENABLED,
                    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
                    Send: ADDRESS_SEND.SEND_YES,
                },
            ])
        );

        const meetingData = {
            meetingName: 'test meeting',
            startTime: '2025-06-23T00:00:00Z',
            endTime: '2025-06-23T01:00:00Z',
            recurrence: null,
            timeZone: 'UTC',
            customPassword: '',
        };

        const { result } = renderHook(() => useCreateMeeting());

        const meeting = await result.current.createMeeting(meetingData);

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'meet/v1/meetings',
                data: expect.objectContaining({
                    StartTime: meetingData.startTime,
                    EndTime: meetingData.endTime,
                    RRule: meetingData.recurrence,
                    Timezone: meetingData.timeZone,
                    CustomPassword: CustomPasswordState.NO_PASSWORD,
                    AddressID: 'test-address-id',
                }),
            })
        );

        expect(meeting).toEqual(
            expect.objectContaining({
                meetingLink: `/join/id-${meetingLinkName}#pwd-mockpassword`,
                id: meetingLinkName,
            })
        );
    });
});
