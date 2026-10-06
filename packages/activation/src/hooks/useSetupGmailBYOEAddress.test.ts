import { act, renderHook } from '@testing-library/react-hooks';
import { getUnixTime } from 'date-fns';

import { useAddresses } from '@proton/account/addresses/hooks';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { useFlag } from '@proton/unleash/useFlag';

import { startEasySwitchSignupImportTask } from '../api';
import type { ImportToken } from '../interface';
import { BYOE_ADDRESS_ERROR, EASY_SWITCH_SOURCES, OAUTH_PROVIDER, TIME_PERIOD } from '../interface';
import useBYOEFeatureStatus from './useBYOEFeatureStatus';
import useSetupGmailBYOEAddress from './useSetupGmailBYOEAddress';

jest.mock('../logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: any) => children,
}));

const mockEasySwitchDispatch = jest.fn();
jest.mock('../logic/store', () => ({
    useEasySwitchDispatch: () => mockEasySwitchDispatch,
    useEasySwitchSelector: jest.fn(() => []),
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

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    __esModule: true,
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const mockErrorHandler = jest.fn();
jest.mock('@proton/components/hooks/useErrorHandler', () => ({
    __esModule: true,
    default: () => mockErrorHandler,
}));

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => false),
}));

const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

jest.mock('./useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

jest.mock('../thunks/byoeAddresses', () => ({
    createBYOEAddress: jest.fn(),
    convertBYOEAddress: jest.fn(),
}));

jest.mock('../api', () => ({
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

describe('useSetupGmailBYOEAddress', () => {
    describe('handleBYOEWithImportCallback', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockUseBYOEFeatureStatus.mockReturnValue([true, false] as const);
            mockUseAddresses.mockReturnValue([[], false]);
            mockFindUserAddress.mockReturnValue(undefined);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockResolvedValue({ Email: 'test@gmail.com', ID: 'addr-id' });
            mockApi.mockResolvedValue({});
            mockUseFlag.mockReturnValue(false);
        });

        it('should do nothing when hasError is true', async () => {
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: true,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });

        it('should do nothing when hasAccessToBYOE is false', async () => {
            mockUseBYOEFeatureStatus.mockReturnValue([false, false] as const);
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });

        it('should create address, call import API and show success modal', async () => {
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockApi).toHaveBeenCalled();
            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ AutomaticImport: true }));
            expect(mockShowSuccessModal).toHaveBeenCalledWith('test@gmail.com', true);
        });

        it('should send no StartTime when importing all messages', async () => {
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: jest.fn(),
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ StartTime: undefined }));
        });

        it('should send no StartTime when importing without a period (import period flag off)', async () => {
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: jest.fn(),
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: undefined,
                    token: mockToken,
                });
            });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ AutomaticImport: true, StartTime: undefined })
            );
        });

        it('should send the StartTime matching the selected import period', async () => {
            jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00Z'));
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: jest.fn(),
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.LAST_3_MONTHS,
                    token: mockToken,
                });
            });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ StartTime: getUnixTime(new Date('2026-07-01T12:00:00Z')) })
            );
            jest.useRealTimers();
        });

        it('should send no StartTime when importEmails is false, even if a period is given', async () => {
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: jest.fn(),
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: false,
                    importPeriod: TIME_PERIOD.LAST_3_MONTHS,
                    token: mockToken,
                });
            });

            expect(mockStartImportTask).toHaveBeenCalledWith(
                expect.objectContaining({ AutomaticImport: false, StartTime: undefined })
            );
        });

        it('should create address but not start an automatic import when importEmails is false', async () => {
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: false,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ AutomaticImport: false }));
            expect(mockShowSuccessModal).toHaveBeenCalledWith('test@gmail.com', false);
        });

        it('should show error notification and not call import API when address already exists and is a BYOE address', async () => {
            mockFindUserAddress.mockReturnValue({ Email: 'test@gmail.com' } as any);
            mockGetIsBYOEAddress.mockReturnValue(true);
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });

        it('should show the address linked to another account modal when the api fails with error code 2011', async () => {
            mockApi.mockRejectedValue({
                data: { Code: BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS, Error: 'Address already exists' },
            });
            const mockShowAddressLinkedToAnotherAccountModal = jest.fn();
            const mockShowSuccessModal = jest.fn();

            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    showAddressLinkedToAnotherAccountModal: mockShowAddressLinkedToAnotherAccountModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockShowAddressLinkedToAnotherAccountModal).toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        describe('claimable external address check', () => {
            const rejectWith2011 = () =>
                Object.assign(new Error('exists'), {
                    data: { Code: BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS, Error: 'Address already exists' },
                });
            const isClaimableCall = (call: any[]) => call[0]?.url === 'claimable';

            const setup = async (checkResult: () => Promise<any>, { flagEnabled = true } = {}) => {
                mockUseFlag.mockImplementation((flag) => flag === 'CanClaimExternalAddress' && flagEnabled);
                mockApi.mockImplementation((config: any) =>
                    config.url === 'claimable' ? checkResult() : Promise.reject(rejectWith2011())
                );
                const showClaimable = jest.fn();
                const showLegacy = jest.fn();
                const { result } = renderHook(() =>
                    useSetupGmailBYOEAddress({
                        showSuccessModal: jest.fn(),
                        showAddressLinkedToAnotherAccountModal: showLegacy,
                        showClaimableAddressModal: showClaimable,
                        source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                    })
                );
                await act(async () => {
                    await result.current.handleBYOEWithImportCallback({
                        hasError: false,
                        importEmails: true,
                        importPeriod: undefined,
                        token: mockToken,
                    });
                });
                return { showClaimable, showLegacy };
            };

            it('should show the claimable modal on 2011 when the address is claimable', async () => {
                const { showClaimable, showLegacy } = await setup(async () => ({ CanBeClaimed: true }));
                expect(showClaimable).toHaveBeenCalledWith(mockToken.Account);
                expect(showLegacy).not.toHaveBeenCalled();
            });

            it('should show the legacy modal on 2011 when the address is not claimable', async () => {
                const { showClaimable, showLegacy } = await setup(async () => ({ CanBeClaimed: false }));
                expect(showLegacy).toHaveBeenCalled();
                expect(showClaimable).not.toHaveBeenCalled();
            });

            it('should fall back to the legacy modal on 2011 when the claimable check fails', async () => {
                const { showClaimable, showLegacy } = await setup(() => Promise.reject(new Error('Network error')));
                expect(showLegacy).toHaveBeenCalled();
                expect(showClaimable).not.toHaveBeenCalled();
            });

            it('should skip the claimable check and show the legacy modal on 2011 when the flag is disabled', async () => {
                const { showClaimable, showLegacy } = await setup(async () => ({ CanBeClaimed: true }), {
                    flagEnabled: false,
                });
                expect(mockApi.mock.calls.some(isClaimableCall)).toBe(false);
                expect(showLegacy).toHaveBeenCalled();
                expect(showClaimable).not.toHaveBeenCalled();
            });

            it('should never call the claimable endpoint when the import succeeds', async () => {
                const showClaimable = jest.fn();
                const { result } = renderHook(() =>
                    useSetupGmailBYOEAddress({
                        showSuccessModal: jest.fn(),
                        showClaimableAddressModal: showClaimable,
                        source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                    })
                );
                await act(async () => {
                    await result.current.handleBYOEWithImportCallback({
                        hasError: false,
                        importEmails: true,
                        importPeriod: undefined,
                        token: mockToken,
                    });
                });
                expect(mockApi.mock.calls.some(isClaimableCall)).toBe(false);
                expect(showClaimable).not.toHaveBeenCalled();
            });
        });

        it('if API fails with an error other than 2011 then it should be handled as normal', async () => {
            mockApi.mockRejectedValue({
                data: {
                    Code: 2000,
                    Error: 'Source is required',
                },
            });
            const mockShowAddressLinkedToAnotherAccountModal = jest.fn();
            const mockShowSuccessModal = jest.fn();

            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    showAddressLinkedToAnotherAccountModal: mockShowAddressLinkedToAnotherAccountModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: true,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockErrorHandler).toHaveBeenCalled();
            expect(mockShowAddressLinkedToAnotherAccountModal).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('should convert address, call import API and show success modal when address exists and is not BYOE', async () => {
            const existingAddress = { Email: 'test@gmail.com', ID: 'addr-id' } as any;
            mockFindUserAddress.mockReturnValue(existingAddress);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockResolvedValue({ Email: 'test@gmail.com', ID: 'addr-id' });
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: false,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalled();
            expect(mockShowSuccessModal).toHaveBeenCalledWith('test@gmail.com', false);
        });

        it('should show error notification and not show success modal when conversion fails', async () => {
            const existingAddress = { Email: 'test@gmail.com', ID: 'addr-id' } as any;
            mockFindUserAddress.mockReturnValue(existingAddress);
            mockGetIsBYOEAddress.mockReturnValue(false);
            mockDispatch.mockRejectedValue(new Error('Conversion failed'));
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() =>
                useSetupGmailBYOEAddress({
                    showSuccessModal: mockShowSuccessModal,
                    source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                })
            );

            await act(async () => {
                await result.current.handleBYOEWithImportCallback({
                    hasError: false,
                    importEmails: false,
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    token: mockToken,
                });
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });
    });
});
