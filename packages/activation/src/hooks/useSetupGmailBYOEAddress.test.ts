import { act, renderHook } from '@testing-library/react-hooks';

import { useAddresses } from '@proton/account/addresses/hooks';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import type { ImportToken } from '@proton/activation/src/interface';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { findUserAddress } from '@proton/shared/lib/helpers/address';

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
}));

jest.mock('@proton/activation/src/api', () => ({
    startEasySwitchSignupImportTask: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/address', () => ({
    findUserAddress: jest.fn(),
}));
const mockFindUserAddress = findUserAddress as jest.MockedFunction<typeof findUserAddress>;

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
            mockUseBYOEFeatureStatus.mockReturnValue(true);
            mockUseAddresses.mockReturnValue([[], false]);
            mockFindUserAddress.mockReturnValue(undefined);
            mockDispatch.mockResolvedValue({ Email: 'test@gmail.com', ID: 'addr-id' });
            mockApi.mockResolvedValue({});
        });

        it('should do nothing when hasError is true', async () => {
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() => useSetupGmailBYOEAddress({ showSuccessModal: mockShowSuccessModal }));

            await act(async () => {
                await result.current.handleBYOEWithImportCallback(true, mockToken);
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });

        it('should do nothing when hasAccessToBYOE is false', async () => {
            mockUseBYOEFeatureStatus.mockReturnValue(false);
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() => useSetupGmailBYOEAddress({ showSuccessModal: mockShowSuccessModal }));

            await act(async () => {
                await result.current.handleBYOEWithImportCallback(false, mockToken);
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });

        it('should create address, call import API and show success modal', async () => {
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() => useSetupGmailBYOEAddress({ showSuccessModal: mockShowSuccessModal }));

            await act(async () => {
                await result.current.handleBYOEWithImportCallback(false, mockToken);
            });

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockApi).toHaveBeenCalled();
            expect(mockShowSuccessModal).toHaveBeenCalledWith('test@gmail.com');
        });

        it('should show error notification and not call import API when address already exists', async () => {
            mockFindUserAddress.mockReturnValue({ Email: 'test@gmail.com' } as any);
            const mockShowSuccessModal = jest.fn();
            const { result } = renderHook(() => useSetupGmailBYOEAddress({ showSuccessModal: mockShowSuccessModal }));

            await act(async () => {
                await result.current.handleBYOEWithImportCallback(false, mockToken);
            });

            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockApi).not.toHaveBeenCalled();
            expect(mockShowSuccessModal).not.toHaveBeenCalled();
        });
    });
});
