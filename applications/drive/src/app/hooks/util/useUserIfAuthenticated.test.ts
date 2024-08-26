import { renderHook } from '@testing-library/react-hooks';

import { useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getUser } from '@proton/shared/lib/api/user';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { sendErrorReport } from '../../utils/errorHandling';
import { useUserIfAuthenticated } from './useUserIfAuthenticated';

jest.mock('@proton/components/hooks/useApi');

jest.mock('../../utils/errorHandling', () => {
    return {
        ...jest.requireActual('../../utils/errorHandling'),
        sendErrorReport: jest.fn(),
    };
});

const mockUseApi = jest.mocked(useApi);
const mockSendErrorReport = jest.mocked(sendErrorReport);

jest.mock('@proton/hooks/useLoading');
const mockedWithLoading = jest.fn().mockImplementation((fn) => fn());
jest.mocked(useLoading).mockReturnValue([true, mockedWithLoading, () => {}]);

describe('useUserIfAuthenticated', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return undefined user when not authenticated', async () => {
        const { result } = renderHook(() => useUserIfAuthenticated(false));
        expect(result.current.user).toBeUndefined();
    });

    test('should fetch and return user when authenticated', async () => {
        const mockSessionUID = 'test-uid';
        const ID = '1';
        const Name = 'Test name';
        const mockUser = { ID, Name } as unknown as UserModel;
        const mockCall = jest.fn().mockResolvedValue(mockUser);
        mockUseApi.mockReturnValue(mockCall);

        const { result, waitForNextUpdate } = renderHook(() => useUserIfAuthenticated(true, mockSessionUID));

        await waitForNextUpdate();

        expect(result.current.user?.Name).toEqual(Name);
        expect(result.current.user?.ID).toEqual(ID);
        expect(mockCall).toHaveBeenCalledWith({
            ...getUser(),
            headers: {
                'x-pm-uid': mockSessionUID,
            },
        } as any);
    });

    test('should handle API errors gracefully', async () => {
        const mockSessionUID = 'test-uid-api-error';
        const mockError = new Error('API Error');
        mockUseApi.mockReturnValue(jest.fn().mockRejectedValue(mockError));

        const { result, waitFor } = renderHook(() => useUserIfAuthenticated(true, mockSessionUID));

        await waitFor(() => expect(mockUseApi).toHaveBeenCalledTimes(1));

        expect(result.current.user).toBeUndefined();
        expect(mockSendErrorReport).toHaveBeenCalledWith(mockError);
    });

    test('should update user when props change (session switch)', async () => {
        const mockSessionUID = 'test-uid';
        const mockUser1 = { ID: '1', Name: 'Test name 1' } as UserModel;
        const mockUser2 = { ID: '2', Name: 'Test name 2' } as UserModel;

        const mockCall = jest.fn().mockResolvedValueOnce(mockUser1).mockResolvedValueOnce(mockUser2);

        mockUseApi.mockReturnValue(mockCall);

        const { result, waitForNextUpdate, rerender } = renderHook(
            ({ isAuthenticated, sessionUID }) => useUserIfAuthenticated(isAuthenticated, sessionUID),
            { initialProps: { isAuthenticated: true, sessionUID: mockSessionUID } }
        );

        await waitForNextUpdate();

        expect(result.current.user?.Name).toEqual('Test name 1');
        expect(result.current.user?.ID).toEqual('1');

        rerender({ isAuthenticated: true, sessionUID: 'new-session-uid' });

        await waitForNextUpdate();

        expect(result.current.user?.Name).toEqual('Test name 2');
        expect(result.current.user?.ID).toEqual('2');

        expect(mockCall).toHaveBeenCalledTimes(2);
        expect(mockCall).toHaveBeenCalledWith({
            ...getUser(),
            headers: {
                'x-pm-uid': mockSessionUID,
            },
        });
        expect(mockCall).toHaveBeenCalledWith({
            ...getUser(),
            headers: {
                'x-pm-uid': 'new-session-uid',
            },
        });
    });
});
