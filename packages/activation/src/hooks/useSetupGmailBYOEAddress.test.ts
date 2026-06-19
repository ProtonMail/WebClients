import { act, renderHook } from '@testing-library/react-hooks';

import { useAddresses } from '@proton/account/addresses/hooks';
import { startEasySwitchSignupImportTask } from '@proton/activation/src/api';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import type { ImportToken } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

jest.mock('@proton/activation/src/logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: any) => children,
}));

const mockEasySwitchDispatch = jest.fn();
jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: () => mockEasySwitchDispatch,
    useEasySwitchSelector: jest.fn(() => []),
}));

const mockDispatch = jest.fn();
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    __esModule: true,
    useDispatch: () => mockDispatch,
}));

const mockApi = jest.fn();
jest.mock('@proton/components/index', () => ({
    useApi: () => mockApi,
}));

jest.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

const mockCreateNotification = jest.fn();
jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: () => ({ createNotification: mockCreateNotification }),
}));

jest.mock('@proton/components/hooks/useErrorHandler', () => ({
    __esModule: true,
    default: () => jest.fn(),
}));

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => false),
}));

jest.mock('@proton/activation/src/hooks/useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

jest.mock('@proton/account/addresses/actions', () => ({
    createBYOEAddress: jest.fn(),
    convertBYOEAddress: jest.fn(),
}));

jest.mock('@proton/activation/src/api', () => ({
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
