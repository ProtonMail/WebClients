import { act, renderHook } from '@testing-library/react';
import { getUnixTime } from 'date-fns';

import { useAddresses } from '@proton/account/addresses/hooks';
import { buildAddress } from '@proton/account/testing/buildAddress';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { useFlag } from '@proton/unleash/useFlag';

import { startEasySwitchSignupImportTask } from '../api/api';
import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';
import type { ImportToken } from '../interface';
import {
    BYOE_ADDRESS_ERROR,
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    OAUTH_PROVIDER,
    TIME_PERIOD,
} from '../interface';
import { createTokenItem } from '../logic/sync/sync.actions';
import type { ConnectBYOEAddressResult } from './connectBYOEAddress.interface';
import { useConnectBYOEAddress } from './useConnectBYOEAddress';

/*
 * Port of the `handleBYOEWithImportCallback` tests of `useSetupGmailBYOEAddress`.
 * Same setup and same API/dispatch expectations, only the outcome changes:
 * a returned result replaces the callbacks.
 *
 * Not ported: "should do nothing when hasError is true".
 * The method takes a token, so there is no error input.
 */

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

jest.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => false),
}));
const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

jest.mock('../hooks/useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

jest.mock('../logic/sync/sync.actions', () => ({
    WRONG_ACCOUNT_ERROR: 'wrong_account',
    createTokenItem: jest.fn((props) => ({ type: 'token/create', props })),
    loadSyncList: jest.fn(() => ({ type: 'sync/load' })),
}));
const mockCreateTokenItem = createTokenItem as unknown as jest.Mock;

jest.mock('../thunks/byoeAddresses', () => ({
    createBYOEAddress: jest.fn(),
    convertBYOEAddress: jest.fn(),
}));

jest.mock('../api/api', () => ({
    startEasySwitchSignupImportTask: jest.fn(),
    checkExternalAddressClaimable: jest.fn((Email: string) => ({ url: 'claimable', method: 'POST', Email })),
}));

jest.mock('@proton/shared/lib/helpers/address', () => ({
    findUserAddress: jest.fn(),
    getIsBYOEAddress: jest.fn(),
}));
const mockFindUserAddress = findUserAddress as jest.MockedFunction<typeof findUserAddress>;
const mockGetIsBYOEAddress = getIsBYOEAddress as jest.MockedFunction<typeof getIsBYOEAddress>;
const mockStartImportTask = startEasySwitchSignupImportTask as jest.MockedFunction<
    typeof startEasySwitchSignupImportTask
>;

const mockToken: ImportToken = {
    ID: 'token-id',
    Account: 'test@gmail.com',
    Provider: OAUTH_PROVIDER.GOOGLE,
    Products: [],
    Features: [],
};

const createdAddress = buildAddress({ Email: mockToken.Account, ID: 'addr-id' });

const connect = async (args: { importEmails?: boolean; importPeriod?: TIME_PERIOD; token?: ImportToken } = {}) => {
    const { result } = renderHook(() => useConnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS }));

    let outcome: ConnectBYOEAddressResult | undefined;
    await act(async () => {
        outcome = await result.current.connectBYOEAddress({
            importEmails: true,
            importPeriod: TIME_PERIOD.BIG_BANG,
            token: mockToken,
            ...args,
        });
    });
    return outcome!;
};

describe('useConnectBYOEAddress', () => {
    describe('connectBYOEAddress', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockUseBYOEFeatureStatus.mockReturnValue([true, false] as const);
            mockUseAddresses.mockReturnValue([[], false]);
            mockFindUserAddress.mockReturnValue(undefined);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockResolvedValue(createdAddress);
            mockApi.mockResolvedValue({});
            mockUseFlag.mockReturnValue(false);
        });

        it('should return no-access and do nothing when hasAccessToBYOE is false', async () => {
            mockUseBYOEFeatureStatus.mockReturnValue([false, false] as const);

            const outcome = await connect();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'no-access' } });
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
        });

        it('should create address, call import API and return success', async () => {
            const outcome = await connect();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockApi).toHaveBeenCalled();
            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({
                    Provider: OAUTH_PROVIDER.GOOGLE,
                    Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                    Account: mockToken.Account,
                    AutomaticImport: true,
                })
            );
            expect(outcome).toEqual({ status: 'success', address: createdAddress, importEmails: true });
        });

        it('should send no StartTime when importing all messages', async () => {
            await connect({ importPeriod: TIME_PERIOD.BIG_BANG });

            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ StartTime: undefined }));
        });

        it('should send no StartTime when importing without a period (import period flag off)', async () => {
            await connect({ importPeriod: undefined });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ AutomaticImport: true, StartTime: undefined })
            );
        });

        it('should send the StartTime matching the selected import period', async () => {
            jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00Z'));

            await connect({ importPeriod: TIME_PERIOD.LAST_3_MONTHS });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ StartTime: getUnixTime(new Date('2026-07-01T12:00:00Z')) })
            );
            jest.useRealTimers();
        });

        it('should send no StartTime when importEmails is false, even if a period is given', async () => {
            await connect({ importEmails: false, importPeriod: TIME_PERIOD.LAST_3_MONTHS });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ AutomaticImport: false, StartTime: undefined })
            );
        });

        it('should create address but not start an automatic import when importEmails is false', async () => {
            const outcome = await connect({ importEmails: false });

            expect(mockApi).toHaveBeenCalled();
            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ AutomaticImport: false }));
            expect(outcome).toEqual({ status: 'success', address: createdAddress, importEmails: false });
        });

        it('should return already-added and not call the import API when the address already is a BYOE address', async () => {
            mockFindUserAddress.mockReturnValue(buildAddress({ Email: mockToken.Account }));
            mockGetIsBYOEAddress.mockReturnValue(true);

            const outcome = await connect();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'already-added' } });
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
        });

        it('should return linked-to-another-account when the api fails with error code 2011', async () => {
            mockApi.mockRejectedValue({
                data: { Code: BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS, Error: 'Address already exists' },
            });

            const outcome = await connect();

            expect(mockApi).toHaveBeenCalled();
            expect(outcome).toEqual({ status: 'failure', reason: { type: 'linked-to-another-account' } });
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        describe('claimable external address check', () => {
            const rejectWith2011 = () =>
                Object.assign(new Error('exists'), {
                    data: { Code: BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS, Error: 'Address already exists' },
                });
            const isClaimableCall = (call: any[]) => call[0]?.url === 'claimable';

            const setup = async (
                checkResult: () => Promise<any>,
                {
                    flagEnabled = true,
                    ...args
                }: { flagEnabled?: boolean; importEmails?: boolean; importPeriod?: TIME_PERIOD } = {}
            ) => {
                mockUseFlag.mockImplementation((flag) => flag === 'CanClaimExternalAddress' && flagEnabled);
                mockApi.mockImplementation((config: any) =>
                    config.url === 'claimable' ? checkResult() : Promise.reject(rejectWith2011())
                );
                return connect({ importPeriod: undefined, ...args });
            };

            it('should return claimable-address on 2011 when the address is claimable', async () => {
                const outcome = await setup(async () => ({ CanBeClaimed: true }));

                expect(outcome).toEqual({
                    status: 'failure',
                    reason: {
                        type: 'claimable-address',
                        email: mockToken.Account,
                        importEmails: true,
                        importPeriod: undefined,
                    },
                });
            });

            it('should return linked-to-another-account on 2011 when the address is not claimable', async () => {
                const outcome = await setup(async () => ({ CanBeClaimed: false }));

                expect(outcome).toEqual({ status: 'failure', reason: { type: 'linked-to-another-account' } });
            });

            it('should fall back to linked-to-another-account on 2011 when the claimable check fails', async () => {
                const outcome = await setup(() => Promise.reject(new Error('Network error')));

                expect(outcome).toEqual({ status: 'failure', reason: { type: 'linked-to-another-account' } });
            });

            it('should skip the claimable check and return linked-to-another-account on 2011 when the flag is disabled', async () => {
                const outcome = await setup(async () => ({ CanBeClaimed: true }), { flagEnabled: false });

                expect(mockApi.mock.calls.some(isClaimableCall)).toBe(false);
                expect(outcome).toEqual({ status: 'failure', reason: { type: 'linked-to-another-account' } });
            });

            it('should never call the claimable endpoint when the import succeeds', async () => {
                const outcome = await connect({ importPeriod: undefined });

                expect(mockApi.mock.calls.some(isClaimableCall)).toBe(false);
                expect(outcome.status).toBe('success');
            });

            // New case: the claim step needs these choices to resume the connection
            it('should carry the import choices needed to claim the address later', async () => {
                const outcome = await setup(async () => ({ CanBeClaimed: true }), {
                    importEmails: false,
                    importPeriod: TIME_PERIOD.LAST_YEAR,
                });

                expect(outcome).toMatchObject({
                    reason: { type: 'claimable-address', importEmails: false, importPeriod: TIME_PERIOD.LAST_YEAR },
                });
            });
        });

        it('should return unknown with the api message when the api fails with an error other than 2011', async () => {
            mockApi.mockRejectedValue({ data: { Code: 2000, Error: 'Source is required' } });

            const outcome = await connect();

            expect(mockApi).toHaveBeenCalled();
            expect(outcome).toEqual({ status: 'failure', reason: { type: 'unknown', message: 'Source is required' } });
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('should convert address, call import API and return success when address exists and is not BYOE', async () => {
            mockFindUserAddress.mockReturnValue(createdAddress);
            mockGetIsBYOEAddress.mockReturnValue(false);

            const outcome = await connect({ importEmails: false });

            expect(mockApi).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalled();
            expect(outcome).toEqual({ status: 'success', address: createdAddress, importEmails: false });
        });

        it('should return convert-failed when conversion fails', async () => {
            mockFindUserAddress.mockReturnValue(createdAddress);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockRejectedValue(new Error('Conversion failed'));

            const outcome = await connect({ importEmails: false });

            expect(mockApi).toHaveBeenCalled();
            expect(outcome).toMatchObject({ status: 'failure', reason: { type: 'convert-failed' } });
        });

        // New cases, without an equivalent in the old method
        it('should return create-failed when creating the address fails', async () => {
            mockDispatch.mockRejectedValue(new Error('Create failed'));

            const outcome = await connect();

            expect(outcome).toMatchObject({ status: 'failure', reason: { type: 'create-failed' } });
        });

        it('should carry the api message when conversion fails', async () => {
            mockFindUserAddress.mockReturnValue(createdAddress);
            mockDispatch.mockRejectedValue({ data: { Code: 2000, Error: 'Boom' } });

            const outcome = await connect();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'convert-failed', message: 'Boom' } });
        });

        it('should carry the api message when creating the address fails', async () => {
            mockDispatch.mockRejectedValue({ data: { Code: 2000, Error: 'Boom' } });

            const outcome = await connect();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'create-failed', message: 'Boom' } });
        });

        // Documents the order, shared with the old hook: the import task starts before the address exists
        it('should start the import task before creating the address, and keep it started when creation fails', async () => {
            mockDispatch.mockRejectedValue(new Error('Create failed'));

            const outcome = await connect();

            expect(outcome).toMatchObject({ status: 'failure', reason: { type: 'create-failed' } });
            expect(mockApi.mock.invocationCallOrder[0]).toBeLessThan(mockDispatch.mock.invocationCallOrder[0]);
        });

        it('should not create the address when the import task fails', async () => {
            mockApi.mockRejectedValue({ data: { Code: 2000, Error: 'Source is required' } });

            await connect();

            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('should return unknown when no address comes back after the connection', async () => {
            mockDispatch.mockResolvedValue(undefined);

            const outcome = await connect();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'unknown' } });
        });

        it('should refresh the sync and importer lists on success only', async () => {
            await connect();
            expect(mockEasySwitchDispatch).toHaveBeenCalledTimes(2);

            mockEasySwitchDispatch.mockClear();
            mockDispatch.mockRejectedValue(new Error('Create failed'));
            await connect();
            expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
        });
    });
    describe('connectBYOEAddressWithCode', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockUseBYOEFeatureStatus.mockReturnValue([true, false] as const);
            mockUseAddresses.mockReturnValue([[], false]);
            mockFindUserAddress.mockReturnValue(undefined);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockResolvedValue(createdAddress);
            mockApi.mockResolvedValue({});
            mockUseFlag.mockReturnValue(false);
            mockEasySwitchDispatch.mockResolvedValue({
                type: 'token/create/fulfilled',
                meta: { requestStatus: 'fulfilled' },
                payload: mockToken,
            });
        });

        const connectWithCode = async (args: { expectedEmailAddress?: string; importPeriod?: TIME_PERIOD } = {}) => {
            const { result } = renderHook(() =>
                useConnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS })
            );

            let outcome: ConnectBYOEAddressResult | undefined;
            await act(async () => {
                outcome = await result.current.connectBYOEAddressWithCode({
                    code: 'the-code',
                    redirectUri: 'https://account.proton.me/lite?action=byoe-mobile',
                    importEmails: true,
                    ...args,
                });
            });
            return outcome!;
        };

        it('should exchange the code for a BYOE token', async () => {
            await connectWithCode({ expectedEmailAddress: 'test@gmail.com' });

            expect(mockCreateTokenItem).toHaveBeenCalledWith({
                Code: 'the-code',
                Provider: OAUTH_PROVIDER.GOOGLE,
                RedirectUri: 'https://account.proton.me/lite?action=byoe-mobile',
                Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                Features: [EASY_SWITCH_FEATURES.BYOE],
                expectedEmailAddress: 'test@gmail.com',
                silent: true,
            });
        });

        it('should connect the address of the token and return success', async () => {
            const outcome = await connectWithCode({ importPeriod: TIME_PERIOD.LAST_YEAR });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ Account: mockToken.Account, AutomaticImport: true })
            );
            expect(outcome).toEqual({ status: 'success', address: createdAddress, importEmails: true });
        });

        it('should return token-failed and not connect anything when the token cannot be created', async () => {
            mockEasySwitchDispatch.mockResolvedValue({
                type: 'token/create/rejected',
                meta: { requestStatus: 'rejected' },
                payload: { Code: 2000, Error: 'Invalid code' },
            });

            const outcome = await connectWithCode();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'token-failed' } });
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('should return token-failed when the rejection has no payload', async () => {
            mockEasySwitchDispatch.mockResolvedValue({
                type: 'token/create/rejected',
                meta: { requestStatus: 'rejected' },
                payload: undefined,
            });

            const outcome = await connectWithCode();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'token-failed' } });
        });

        it('should return wrong-account when the token is for another address than the expected one', async () => {
            mockEasySwitchDispatch.mockResolvedValue({
                type: 'token/create/rejected',
                meta: { requestStatus: 'rejected' },
                payload: { Code: 0, Error: 'wrong_account' },
            });

            const outcome = await connectWithCode({ expectedEmailAddress: 'other@gmail.com' });

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'wrong-account' } });
            expect(mockApi).not.toHaveBeenCalled();
        });

        it('should return the failure of the connection when the token is valid', async () => {
            mockApi.mockRejectedValue({
                data: { Code: BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS, Error: 'Address already exists' },
            });

            const outcome = await connectWithCode();

            expect(outcome).toEqual({ status: 'failure', reason: { type: 'linked-to-another-account' } });
        });
    });
});
