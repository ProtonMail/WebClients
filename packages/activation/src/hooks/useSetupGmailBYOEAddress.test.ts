import { act, renderHook } from '@testing-library/react-hooks';

import { useAddresses } from '@proton/account/addresses/hooks';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

import { startEasySwitchSignupImportTask } from '../api';
import type { ImportToken } from '../interface';
import { BYOE_ADDRESS_ERROR, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '../interface';
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

jest.mock('./useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

jest.mock('@proton/account/addresses/actions', () => ({
    createBYOEAddress: jest.fn(),
    convertBYOEAddress: jest.fn(),
}));

jest.mock('../api', () => ({
    startEasySwitchSignupImportTask: jest.fn(),
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
                await result.current.handleBYOEWithImportCallback(true, true, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, true, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, true, mockToken);
            });

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockApi).toHaveBeenCalled();
            expect(mockStartImportTask).toHaveBeenCalledWith(expect.objectContaining({ AutomaticImport: true }));
            expect(mockShowSuccessModal).toHaveBeenCalledWith('test@gmail.com', true);
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
                await result.current.handleBYOEWithImportCallback(false, false, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, true, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, true, mockToken);
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockShowAddressLinkedToAnotherAccountModal).toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
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
                await result.current.handleBYOEWithImportCallback(false, true, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, false, mockToken);
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
                await result.current.handleBYOEWithImportCallback(false, false, mockToken);
            });

            expect(mockApi).toHaveBeenCalled();
            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });
    });
});
