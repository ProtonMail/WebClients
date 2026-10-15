import { act, renderHook } from '@testing-library/react';

import { buildAddress } from '@proton/account/testing/buildAddress';
import { tracker } from '@proton/telemetry-tracker/tracker';

import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';
import type { ImportToken } from '../interface';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '../interface';
import { createSyncItem, deleteSyncItem } from '../logic/sync/sync.actions';
import { BYOEAddressAction } from '../telemetry/events';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';
import type { ReconnectBYOEAddressResult } from './reconnectBYOEAddress.interface';
import { useReconnectBYOEAddress } from './useReconnectBYOEAddress';

const mockEasySwitchDispatch = jest.fn();
jest.mock('../logic/store', () => ({
    useEasySwitchDispatch: () => mockEasySwitchDispatch,
}));

const mockDispatch = jest.fn();
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    __esModule: true,
    useDispatch: () => mockDispatch,
}));

const mockApi = jest.fn();
jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => mockApi,
}));

jest.mock('../hooks/useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

jest.mock('../logic/sync/sync.actions', () => ({
    WRONG_ACCOUNT_ERROR: 'wrong_account',
    SyncTokenStrategy: { create: 'create', useExisting: 'useExisting' },
    createSyncItem: Object.assign(
        jest.fn((props) => ({ type: 'sync/create', props })),
        { rejected: { match: (action: { type: string }) => action.type.endsWith('rejected') } }
    ),
    deleteSyncItem: jest.fn((props) => ({ type: 'sync/delete', props })),
    loadSyncList: jest.fn(() => ({ type: 'sync/load' })),
}));

jest.mock('../api/api', () => ({
    getTokensByFeature: jest.fn((params) => ({ url: 'tokens', method: 'GET', params })),
}));

jest.mock('../thunks/updateBYOEAddressConnection', () => ({
    updateBYOEAddressConnection: jest.fn((props) => ({ type: 'address/reconnect', props })),
}));
jest.mock('@proton/telemetry-tracker/tracker', () => ({ tracker: { emit: jest.fn() } }));

const mockToken: ImportToken = {
    ID: 'token-id',
    Account: 'test@gmail.com',
    Provider: OAUTH_PROVIDER.GOOGLE,
    Products: [],
    Features: [],
};

describe('useReconnectBYOEAddress', () => {
    const address = buildAddress({ Email: mockToken.Account, ID: 'addr-id' });
    const redirectUri = 'https://account.proton.me/lite?action=byoe-mobile';
    const sharedSyncProps = {
        Source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE,
        expectedEmailAddress: address.Email,
        Features: [EASY_SWITCH_FEATURES.BYOE],
    };

    const setup = () =>
        renderHook(() => useReconnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE })).result;

    const reconnectWithToken = async () => {
        const result = setup();
        let outcome: ReconnectBYOEAddressResult | undefined;
        await act(async () => {
            outcome = await result.current.reconnectWithToken(address, mockToken);
        });
        return outcome!;
    };

    const reconnectWithCode = async () => {
        const result = setup();
        let outcome: ReconnectBYOEAddressResult | undefined;
        await act(async () => {
            outcome = await result.current.reconnectWithCode(address, { code: 'the-code', redirectUri });
        });
        return outcome!;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseBYOEFeatureStatus.mockReturnValue([true, false] as const);
        mockEasySwitchDispatch.mockImplementation(async (action: { type: string }) =>
            action.type === 'sync/create'
                ? { type: 'sync/create/fulfilled', payload: { sync: { id: 'sync-id' } } }
                : undefined
        );
        mockDispatch.mockResolvedValue(address);
    });

    describe('getExistingToken', () => {
        it('should return the token already granted for the address', async () => {
            mockApi.mockResolvedValue({ Tokens: [mockToken] });
            const result = setup();

            await expect(result.current.getExistingToken(address)).resolves.toBe(mockToken);
            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        Account: address.Email,
                        Features: [EASY_SWITCH_FEATURES.BYOE],
                        Provider: OAUTH_PROVIDER.GOOGLE,
                    },
                })
            );
        });

        it('should return undefined when there is none', async () => {
            mockApi.mockResolvedValue({ Tokens: [] });
            const result = setup();

            await expect(result.current.getExistingToken(address)).resolves.toBeUndefined();
        });
    });

    it('should return no-access and do nothing when hasAccessToBYOE is false', async () => {
        mockUseBYOEFeatureStatus.mockReturnValue([false, false] as const);

        const outcome = await reconnectWithToken();

        expect(outcome).toEqual({ status: 'failure', reason: { type: 'no-access' } });
        expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
    });

    it('should create the sync from the existing token, then turn encryption back on', async () => {
        const outcome = await reconnectWithToken();

        expect(createSyncItem).toHaveBeenCalledWith({ type: 'useExisting', token: mockToken, ...sharedSyncProps });
        expect(updateBYOEAddressConnection).toHaveBeenCalledWith({ address, type: 'reconnect' });
        expect(tracker.emit).toHaveBeenCalledWith(BYOEAddressAction, {
            dimensions: { addressAction: 'reconnect', provider: 'google' },
        });
        expect(outcome).toEqual({ status: 'success', address });
    });

    it('should create the sync from the OAuth code, then turn encryption back on', async () => {
        const outcome = await reconnectWithCode();

        expect(createSyncItem).toHaveBeenCalledWith({
            type: 'create',
            Code: 'the-code',
            Provider: OAUTH_PROVIDER.GOOGLE,
            RedirectUri: redirectUri,
            ...sharedSyncProps,
        });
        expect(updateBYOEAddressConnection).toHaveBeenCalledWith({ address, type: 'reconnect' });
        expect(tracker.emit).toHaveBeenCalledWith(BYOEAddressAction, {
            dimensions: { addressAction: 'reconnect', provider: 'google' },
        });
        expect(outcome).toEqual({ status: 'success', address });
    });

    it('should return wrong-account and leave the address alone when another Gmail account is used', async () => {
        mockEasySwitchDispatch.mockResolvedValue({
            type: 'sync/create/rejected',
            payload: { Code: 0, Error: 'wrong_account' },
        });

        const outcome = await reconnectWithCode();

        expect(outcome).toEqual({ status: 'failure', reason: { type: 'wrong-account' } });
        expect(updateBYOEAddressConnection).not.toHaveBeenCalled();
        expect(tracker.emit).not.toHaveBeenCalled();
    });

    it('should not touch the address when the sync cannot be created', async () => {
        mockEasySwitchDispatch.mockResolvedValue({ type: 'sync/create/rejected', payload: { Error: 'nope' } });

        const outcome = await reconnectWithToken();

        expect(outcome).toEqual({ status: 'failure', reason: { type: 'sync-failed' } });
        expect(updateBYOEAddressConnection).not.toHaveBeenCalled();
    });

    it('should delete the new sync when turning encryption back on fails', async () => {
        mockDispatch.mockRejectedValue({ data: { Error: 'flags failed' } });

        const outcome = await reconnectWithToken();

        expect(deleteSyncItem).toHaveBeenCalledWith({ syncId: 'sync-id', showNotification: false });
        expect(outcome).toEqual({ status: 'failure', reason: { type: 'unknown', message: 'flags failed' } });
        expect(tracker.emit).not.toHaveBeenCalled();
    });
});
