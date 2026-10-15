import { act, renderHook } from '@testing-library/react';

import { buildAddress } from '@proton/account/testing/buildAddress';

import type { ReconnectBYOEAddressResult } from '../byoe/reconnectBYOEAddress.interface';
import { getBYOEAddressLimit } from '../helpers/byoeAddresses';
import { type ImportToken, OAUTH_PROVIDER, type OAuthProps } from '../interface';
import useReconnectSync from './useReconnectSync';

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

jest.mock('@proton/account/user/hooks', () => ({ useUser: jest.fn(() => [{}]) }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => jest.fn() }));
jest.mock('../logic/store', () => ({
    useEasySwitchDispatch: () => jest.fn(),
    useEasySwitchSelector: () => undefined,
}));
jest.mock('./useBYOEAddressesCounts', () => ({
    __esModule: true,
    default: () => ({ activeBYOEAddresses: [] }),
}));

jest.mock('../helpers/byoeAddresses', () => ({ getBYOEAddressLimit: jest.fn() }));
const mockGetBYOEAddressLimit = getBYOEAddressLimit as jest.Mock;

const mockTriggerOAuthPopup = jest.fn();
jest.mock('./useOAuthPopup', () => ({
    __esModule: true,
    default: () => ({ triggerOAuthPopup: mockTriggerOAuthPopup, loadingConfig: false }),
}));

const mockGetExistingToken = jest.fn();
const mockReconnectWithToken = jest.fn();
const mockReconnectWithCode = jest.fn();
jest.mock('../byoe/useReconnectBYOEAddress', () => ({
    useReconnectBYOEAddress: () => ({
        getExistingToken: mockGetExistingToken,
        reconnectWithToken: mockReconnectWithToken,
        reconnectWithCode: mockReconnectWithCode,
    }),
}));

const address = buildAddress({ ID: 'address-id', Email: 'jane@gmail.com' });
const token = { ID: 'token-id', Account: 'jane@gmail.com' } as ImportToken;
const success: ReconnectBYOEAddressResult = { status: 'success', address };

const withLoading = jest.fn((promise: Promise<unknown> | (() => Promise<unknown>)) => {
    return typeof promise === 'function' ? promise() : promise;
});

const setup = () => {
    const setUpsellModalOpen = jest.fn();
    const setLimitModalOpen = jest.fn();
    const { result } = renderHook(() => useReconnectSync(address));
    const reconnect = () =>
        act(() =>
            result.current.handleReconnect({
                withLoading: withLoading as any,
                address,
                setUpsellModalOpen,
                setLimitModalOpen,
            })
        );
    return { reconnect, setUpsellModalOpen, setLimitModalOpen };
};

describe('useReconnectSync handleReconnect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetBYOEAddressLimit.mockReturnValue(undefined);
        mockGetExistingToken.mockResolvedValue(undefined);
        mockReconnectWithToken.mockResolvedValue(success);
        mockReconnectWithCode.mockResolvedValue(success);
    });

    describe('limits', () => {
        it('opens the upsell modal and does nothing else when the free limit is reached', async () => {
            mockGetBYOEAddressLimit.mockReturnValue('free-limit');
            const { reconnect, setUpsellModalOpen, setLimitModalOpen } = setup();

            await reconnect();

            expect(setUpsellModalOpen).toHaveBeenCalledWith(true);
            expect(setLimitModalOpen).not.toHaveBeenCalled();
            expect(mockGetExistingToken).not.toHaveBeenCalled();
        });

        it('opens the limit modal and does nothing else when the paid limit is reached', async () => {
            mockGetBYOEAddressLimit.mockReturnValue('paid-limit');
            const { reconnect, setUpsellModalOpen, setLimitModalOpen } = setup();

            await reconnect();

            expect(setLimitModalOpen).toHaveBeenCalledWith(true);
            expect(setUpsellModalOpen).not.toHaveBeenCalled();
            expect(mockGetExistingToken).not.toHaveBeenCalled();
        });
    });

    describe('with an existing token', () => {
        beforeEach(() => {
            mockGetExistingToken.mockResolvedValue(token);
        });

        it('reconnects behind the loading state and tells the user', async () => {
            const { reconnect } = setup();

            await reconnect();

            expect(withLoading).toHaveBeenCalledTimes(1);
            expect(mockReconnectWithToken).toHaveBeenCalledWith(address, token);
            expect(mockTriggerOAuthPopup).not.toHaveBeenCalled();
            expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Address reconnected.' });
        });

        it('shows the message of a failed reconnection', async () => {
            mockReconnectWithToken.mockResolvedValue({
                status: 'failure',
                reason: { type: 'unknown', message: 'Could not update the address' },
            });
            const { reconnect } = setup();

            await reconnect();

            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Could not update the address',
            });
        });

        it('says nothing more for a wrong account, the sync already told the user', async () => {
            mockReconnectWithToken.mockResolvedValue({ status: 'failure', reason: { type: 'wrong-account' } });
            const { reconnect } = setup();

            await reconnect();

            expect(mockCreateNotification).not.toHaveBeenCalled();
        });

        it('tells the user when they have no access to the feature', async () => {
            mockReconnectWithToken.mockResolvedValue({ status: 'failure', reason: { type: 'no-access' } });
            const { reconnect } = setup();

            await reconnect();

            expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        });
    });

    describe('without a token', () => {
        it('opens the Google popup, and reconnects with the code it returns', async () => {
            const { reconnect } = setup();

            await reconnect();

            expect(mockReconnectWithToken).not.toHaveBeenCalled();
            expect(mockTriggerOAuthPopup).toHaveBeenCalledTimes(1);
            const { provider, callback } = mockTriggerOAuthPopup.mock.calls[0][0];
            expect(provider).toBe(OAUTH_PROVIDER.GOOGLE);

            const oAuthProps: OAuthProps = { Code: 'google-code', Provider: OAUTH_PROVIDER.GOOGLE, RedirectUri: 'uri' };
            await act(() => callback(oAuthProps));

            expect(withLoading).toHaveBeenCalledTimes(1);
            expect(mockReconnectWithCode).toHaveBeenCalledWith(address, { code: 'google-code', redirectUri: 'uri' });
            expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Address reconnected.' });
        });
    });
});
