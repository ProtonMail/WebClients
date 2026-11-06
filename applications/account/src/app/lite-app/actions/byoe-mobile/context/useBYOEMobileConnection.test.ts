import { act, renderHook } from '@testing-library/react';

import { buildAddress } from '@proton/account/testing/buildAddress';
import type { ReconnectBYOEAddressResult } from '@proton/activation/src/byoe/reconnectBYOEAddress.interface';
import type { OAuthCallbackResult } from '@proton/activation/src/byoe/useOAuthRedirectFlow.helpers';
import type { ImportToken } from '@proton/activation/src/interface';
import { trackAccountImportBYOEError } from '@proton/activation/src/telemetry/accountImportFlow';

import { useBYOEMobileConnection } from './useBYOEMobileConnection';

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const mockTrackConnectSucceeded = jest.fn();
const mockTrackConnectFailed = jest.fn();
jest.mock('../telemetry/useBYOEMobileTelemetry', () => ({
    useBYOEMobileTelemetry: () => ({
        trackConnectSucceeded: mockTrackConnectSucceeded,
        trackConnectFailed: mockTrackConnectFailed,
    }),
}));

const mockConnectBYOEAddressWithCode = jest.fn();
jest.mock('@proton/activation/src/byoe/useConnectBYOEAddress', () => ({
    useConnectBYOEAddress: () => ({
        connectBYOEAddressWithCode: mockConnectBYOEAddressWithCode,
        claimBYOEAddress: jest.fn(),
    }),
}));

const mockGetExistingToken = jest.fn();
const mockReconnectWithToken = jest.fn();
const mockReconnectWithCode = jest.fn();
jest.mock('@proton/activation/src/byoe/useReconnectBYOEAddress', () => ({
    useReconnectBYOEAddress: () => ({
        getExistingToken: mockGetExistingToken,
        reconnectWithToken: mockReconnectWithToken,
        reconnectWithCode: mockReconnectWithCode,
    }),
}));

const disconnectedAddress = buildAddress({ ID: 'address-id', Email: 'Jane@gmail.com' });
jest.mock('@proton/activation/src/hooks/useBYOEAddresses', () => ({
    useBYOEAddresses: () => ({ addresses: [disconnectedAddress], loading: false }),
}));

jest.mock('@proton/activation/src/telemetry/accountImportFlow', () => ({ trackAccountImportBYOEError: jest.fn() }));

const redirectUri = 'https://account.proton.me/oauth/callback';
const token = { ID: 'token-id', Account: 'jane@gmail.com' } as ImportToken;
const success: ReconnectBYOEAddressResult = { status: 'success', address: disconnectedAddress };

const setup = () => {
    const setStatus = jest.fn();
    const { result } = renderHook(() => useBYOEMobileConnection({ redirectUri, defaultImportEmails: true, setStatus }));
    return { result, setStatus };
};

const getReconnectCallback = (
    type: 'code' | 'error',
    reconnectAddressID = disconnectedAddress.ID
): Exclude<OAuthCallbackResult, { type: 'none' }> => {
    const state = { uid: 'uid', importEmails: false, reconnectAddressID };
    return type === 'code' ? { type: 'code', code: 'google-code', state } : { type: 'error', state };
};

describe('useBYOEMobileConnection reconnection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReconnectWithToken.mockResolvedValue(success);
        mockReconnectWithCode.mockResolvedValue(success);
    });

    describe('reconnectAddress', () => {
        it('reconnects with the existing token and tells the user', async () => {
            mockGetExistingToken.mockResolvedValue(token);
            const { result, setStatus } = setup();

            let outcome;
            await act(async () => {
                outcome = await result.current.reconnectAddress(disconnectedAddress);
            });

            expect(outcome).toBe('reconnected');
            expect(mockReconnectWithToken).toHaveBeenCalledWith(disconnectedAddress, token);
            expect(setStatus.mock.calls).toEqual([['reconnecting'], ['reconnecting'], ['idle']]);
            expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Address reconnected.' });
            expect(result.current.error).toBeNull();
        });

        it('asks for the permission when there is no token, and keeps the screen locked', async () => {
            mockGetExistingToken.mockResolvedValue(undefined);
            const { result, setStatus } = setup();

            let outcome;
            await act(async () => {
                outcome = await result.current.reconnectAddress(disconnectedAddress);
            });

            expect(outcome).toBe('permission-required');
            expect(mockReconnectWithToken).not.toHaveBeenCalled();
            expect(setStatus).toHaveBeenCalledTimes(1);
            expect(setStatus).toHaveBeenCalledWith('reconnecting');
        });

        it('asks for the permission when the token lookup fails', async () => {
            mockGetExistingToken.mockRejectedValue(new Error('network'));
            const { result } = setup();

            let outcome;
            await act(async () => {
                outcome = await result.current.reconnectAddress(disconnectedAddress);
            });

            expect(outcome).toBe('permission-required');
            expect(mockReconnectWithToken).not.toHaveBeenCalled();
        });

        it('shows the failure message and unlocks the screen, without setting an error', async () => {
            mockGetExistingToken.mockResolvedValue(token);
            mockReconnectWithToken.mockResolvedValue({
                status: 'failure',
                reason: { type: 'unknown', message: 'Could not update the address' },
            });
            const { result, setStatus } = setup();

            await act(() => result.current.reconnectAddress(disconnectedAddress));

            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Could not update the address',
            });
            expect(setStatus).toHaveBeenLastCalledWith('idle');
            expect(result.current.error).toBeNull();
        });

        it('does not add a notification for a wrong account, the sync already told the user', async () => {
            mockGetExistingToken.mockResolvedValue(token);
            mockReconnectWithToken.mockResolvedValue({ status: 'failure', reason: { type: 'wrong-account' } });
            const { result } = setup();

            await act(() => result.current.reconnectAddress(disconnectedAddress));

            expect(mockCreateNotification).not.toHaveBeenCalled();
        });

        it('shows a generic error and unlocks the screen when the reconnection throws', async () => {
            mockGetExistingToken.mockResolvedValue(token);
            mockReconnectWithToken.mockRejectedValue(new Error('boom'));
            const { result, setStatus } = setup();

            await act(() => result.current.reconnectAddress(disconnectedAddress));

            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: "We couldn't reconnect this address.",
            });
            expect(setStatus).toHaveBeenLastCalledWith('idle');
        });
    });

    describe('handleOAuthCallback', () => {
        it('reconnects through the code when the address to reconnect is a known one', async () => {
            const { result, setStatus } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('code')));

            expect(mockReconnectWithCode).toHaveBeenCalledWith(disconnectedAddress, {
                code: 'google-code',
                redirectUri,
            });
            expect(mockConnectBYOEAddressWithCode).not.toHaveBeenCalled();
            expect(setStatus.mock.calls).toEqual([['connecting'], ['idle']]);
            expect(result.current.connectingEmail).toBe(disconnectedAddress.Email);
            expect(result.current.error).toBeNull();
        });

        it('connects a new address when the address to reconnect is unknown', async () => {
            mockConnectBYOEAddressWithCode.mockResolvedValue({
                status: 'success',
                address: disconnectedAddress,
                importEmails: false,
            });
            const { result } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('code', 'unknown-id')));

            expect(mockReconnectWithCode).not.toHaveBeenCalled();
            expect(mockConnectBYOEAddressWithCode).toHaveBeenCalledTimes(1);
            expect(mockTrackConnectSucceeded).toHaveBeenCalledTimes(1);
        });

        it('does not track a success when the connection fails', async () => {
            mockConnectBYOEAddressWithCode.mockResolvedValue({ status: 'failure', reason: { type: 'unknown' } });
            const { result } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('code', 'unknown-id')));

            expect(mockTrackConnectSucceeded).not.toHaveBeenCalled();
            expect(mockTrackConnectFailed).toHaveBeenCalledWith('unknown');
        });

        it('does not track a failure for the claimable address confirmation', async () => {
            mockConnectBYOEAddressWithCode.mockResolvedValue({
                status: 'failure',
                reason: { type: 'claimable-address', email: 'jane@gmail.com', importEmails: false },
            });
            const { result } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('code', 'unknown-id')));

            expect(mockTrackConnectFailed).not.toHaveBeenCalled();
        });

        it('tracks token-failed when Google returns an error', async () => {
            const { result } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('error', 'unknown-id')));

            expect(mockTrackConnectFailed).toHaveBeenCalledWith('token-failed');
        });

        it('only notifies when the user declined the permission of a reconnection', async () => {
            const { result, setStatus } = setup();

            await act(() => result.current.handleOAuthCallback(getReconnectCallback('error')));

            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Permissions request failed.',
            });
            expect(result.current.error).toBeNull();
            expect(setStatus).not.toHaveBeenCalled();
            expect(trackAccountImportBYOEError).not.toHaveBeenCalled();
            expect(mockReconnectWithCode).not.toHaveBeenCalled();
        });
    });
});
